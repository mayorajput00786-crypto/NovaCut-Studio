#!/usr/bin/env python3
"""
NovaCut Studio - Windows PE Executable Builder
Generates a valid PE32 (x86) Windows GUI executable that runs natively on Windows 10/11.
When executed, it launches the NovaCut Studio installer and desktop environment.
"""

import struct
import os
import sys

def build_windows_pe_exe(output_path: str, app_title: str = "NovaCut Studio Desktop"):
    # Target: PE32 (x86 32-bit GUI executable, runs on all 32-bit and 64-bit Windows systems)
    # Image Base: 0x00400000
    # Section Alignment: 0x1000
    # File Alignment: 0x200
    
    # Text strings to embed
    cmd_to_run = b"cmd.exe /c start \"\" \"Install-NovaCut-Studio.bat\"\x00"
    msg_title = f"{app_title}\x00".encode('ascii')
    msg_text = b"Starting NovaCut Studio Desktop Setup & Offline Licensing Engine...\n\nPlease ensure Node.js is installed or allow the installer to configure your environment.\x00"
    
    # We will lay out:
    # Header: 0x000 - 0x400 (file size: 0x400, padded to 0x400)
    # Section 1 (.text): RVA 0x1000, File Offset 0x400, Size 0x200
    # Section 2 (.rdata): RVA 0x2000, File Offset 0x600, Size 0x400 (Imports + Strings)
    
    # Let's design .rdata:
    # RVA 0x2000:
    # Strings at relative offsets inside .rdata:
    # 0x00: msg_text
    # 0x80: msg_title
    # 0xA0: cmd_to_run
    # 0xD0: "USER32.dll\0"
    # 0xE0: "KERNEL32.dll\0"
    # 0xF0: "MessageBoxA\0" (preceded by hint 0x0000)
    # 0x100: "WinExec\0" (preceded by hint 0x0000)
    # 0x110: "ExitProcess\0" (preceded by hint 0x0000)
    # 0x130: Import Directory Table (IDT) - 3 entries: USER32, KERNEL32, NULL terminator
    # 0x170: Import Lookup Table (ILT) USER32
    # 0x180: Import Lookup Table (ILT) KERNEL32
    # 0x190: Import Address Table (IAT) USER32
    # 0x1A0: Import Address Table (IAT) KERNEL32
    
    rdata = bytearray(0x400)
    
    str_msg_text_off = 0x00
    rdata[str_msg_text_off:str_msg_text_off+len(msg_text)] = msg_text
    
    str_msg_title_off = 0x80
    rdata[str_msg_title_off:str_msg_title_off+len(msg_title)] = msg_title
    
    str_cmd_off = 0xA0
    rdata[str_cmd_off:str_cmd_off+len(cmd_to_run)] = cmd_to_run
    
    dll_user32_off = 0xD0
    rdata[dll_user32_off:dll_user32_off+11] = b"USER32.dll\x00"
    
    dll_kernel32_off = 0xE0
    rdata[dll_kernel32_off:dll_kernel32_off+13] = b"KERNEL32.dll\x00"
    
    # Hint/Name entries: Hint (2 bytes) + Name + null
    hn_msgbox_off = 0xF0
    rdata[hn_msgbox_off:hn_msgbox_off+14] = b"\x00\x00MessageBoxA\x00"
    
    hn_winexec_off = 0x104
    rdata[hn_winexec_off:hn_winexec_off+10] = b"\x00\x00WinExec\x00"
    
    hn_exitproc_off = 0x112
    rdata[hn_exitproc_off:hn_exitproc_off+14] = b"\x00\x00ExitProcess\x00"
    
    # RVAs inside module (0x2000 base for .rdata)
    rva_rdata = 0x2000
    rva_msg_text = rva_rdata + str_msg_text_off
    rva_msg_title = rva_rdata + str_msg_title_off
    rva_cmd = rva_rdata + str_cmd_off
    
    rva_dll_user32 = rva_rdata + dll_user32_off
    rva_dll_kernel32 = rva_rdata + dll_kernel32_off
    
    rva_hn_msgbox = rva_rdata + hn_msgbox_off
    rva_hn_winexec = rva_rdata + hn_winexec_off
    rva_hn_exitproc = rva_rdata + hn_exitproc_off
    
    # ILT & IAT tables
    # USER32: 1 function (MessageBoxA)
    ilt_user32_off = 0x150
    iat_user32_off = 0x160
    struct.pack_into("<II", rdata, ilt_user32_off, rva_hn_msgbox, 0)
    struct.pack_into("<II", rdata, iat_user32_off, rva_hn_msgbox, 0)
    
    # KERNEL32: 2 functions (WinExec, ExitProcess)
    ilt_kernel32_off = 0x170
    iat_kernel32_off = 0x180
    struct.pack_into("<III", rdata, ilt_kernel32_off, rva_hn_winexec, rva_hn_exitproc, 0)
    struct.pack_into("<III", rdata, iat_kernel32_off, rva_hn_winexec, rva_hn_exitproc, 0)
    
    # Import Directory Table (IDT)
    # Entry: OriginalFirstThunk (ILT), TimeDateStamp, ForwarderChain, Name, FirstThunk (IAT)
    idt_off = 0x1A0
    struct.pack_into("<IIIII", rdata, idt_off,
                     rva_rdata + ilt_user32_off, 0, 0, rva_dll_user32, rva_rdata + iat_user32_off)
    struct.pack_into("<IIIII", rdata, idt_off + 20,
                     rva_rdata + ilt_kernel32_off, 0, 0, rva_dll_kernel32, rva_rdata + iat_kernel32_off)
    # Null terminator entry (20 bytes zero) at idt_off + 40
    
    # Machine Code in .text section (RVA 0x1000):
    # Calling conventions (stdcall x86):
    # 1. MessageBoxA(NULL, lpText, lpCaption, MB_OK | MB_ICONINFORMATION = 0x40)
    #    push 0x40
    #    push 0x00400000 + rva_msg_title
    #    push 0x00400000 + rva_msg_text
    #    push 0
    #    call [0x00400000 + rva_iat_user32]
    #
    # 2. WinExec(lpCmdLine, SW_SHOWNORMAL = 1)
    #    push 1
    #    push 0x00400000 + rva_cmd
    #    call [0x00400000 + rva_iat_winexec]
    #
    # 3. ExitProcess(0)
    #    push 0
    #    call [0x00400000 + rva_iat_exitproc]
    
    base = 0x00400000
    addr_msg_title = base + rva_msg_title
    addr_msg_text = base + rva_msg_text
    addr_cmd = base + rva_cmd
    addr_iat_msgbox = base + rva_rdata + iat_user32_off
    addr_iat_winexec = base + rva_rdata + iat_kernel32_off
    addr_iat_exitproc = base + rva_rdata + iat_kernel32_off + 4
    
    code = bytearray()
    
    # push 0x40 (MB_OK | MB_ICONINFORMATION)
    code.extend(b"\x6A\x40")
    # push addr_msg_title
    code.extend(b"\x68" + struct.pack("<I", addr_msg_title))
    # push addr_msg_text
    code.extend(b"\x68" + struct.pack("<I", addr_msg_text))
    # push 0 (hWnd)
    code.extend(b"\x6A\x00")
    # call dword ptr [addr_iat_msgbox] (FF 15 xx xx xx xx)
    code.extend(b"\xFF\x15" + struct.pack("<I", addr_iat_msgbox))
    
    # push 1 (SW_SHOWNORMAL)
    code.extend(b"\x6A\x01")
    # push addr_cmd
    code.extend(b"\x68" + struct.pack("<I", addr_cmd))
    # call dword ptr [addr_iat_winexec]
    code.extend(b"\xFF\x15" + struct.pack("<I", addr_iat_winexec))
    
    # push 0 (uExitCode)
    code.extend(b"\x6A\x00")
    # call dword ptr [addr_iat_exitproc]
    code.extend(b"\xFF\x15" + struct.pack("<I", addr_iat_exitproc))
    
    # ret
    code.extend(b"\xC3")
    
    # Pad .text to 0x200 bytes (file alignment)
    text_section = bytearray(0x200)
    text_section[0:len(code)] = code
    
    # Now build the PE Header (0x400 bytes)
    header = bytearray(0x400)
    
    # DOS Header
    header[0:2] = b"MZ"
    # Offset to PE signature at 0x3C
    pe_offset = 0x80
    struct.pack_into("<I", header, 0x3C, pe_offset)
    
    # DOS Stub at 0x40:
    dos_stub = b"This program cannot be run in DOS mode.\r\r\n$"
    header[0x40:0x40+len(dos_stub)] = dos_stub
    
    # PE Signature
    header[pe_offset:pe_offset+4] = b"PE\x00\x00"
    coff_off = pe_offset + 4
    
    # COFF File Header:
    # Machine: 0x014C (i386)
    # NumberOfSections: 2
    # TimeDateStamp: 0x65F00000
    # PointerToSymbolTable: 0
    # NumberOfSymbols: 0
    # SizeOfOptionalHeader: 224 (0xE0)
    # Characteristics: 0x0102 (EXECUTABLE_IMAGE | 32BIT_MACHINE)
    struct.pack_into("<HHIIIHH", header, coff_off,
                     0x014C, 2, 0x65F00000, 0, 0, 0xE0, 0x0102)
    
    opt_off = coff_off + 20
    # Standard Optional Header (PE32):
    # Magic: 0x010B
    # Major/MinorLinkerVersion: 14, 0
    # SizeOfCode: 0x200
    # SizeOfInitializedData: 0x400
    # SizeOfUninitializedData: 0
    # AddressOfEntryPoint: 0x1000 (.text)
    # BaseOfCode: 0x1000
    # BaseOfData: 0x2000
    # ImageBase: 0x00400000
    # SectionAlignment: 0x1000
    # FileAlignment: 0x200
    # MajorOperatingSystemVersion: 6, Minor: 0 (Windows 10/11 / Vista+)
    # MajorImageVersion: 1, Minor: 0
    # MajorSubsystemVersion: 6, Minor: 0
    # Win32VersionValue: 0
    # SizeOfImage: 0x3000 (Header + .text + .rdata rounded to 0x1000)
    # SizeOfHeaders: 0x400
    # CheckSum: 0
    # Subsystem: 2 (IMAGE_SUBSYSTEM_WINDOWS_GUI)
    # DllCharacteristics: 0x8140 (DYNAMIC_BASE | NX_COMPAT | TERMINAL_SERVER_AWARE)
    # SizeOfStackReserve: 0x100000
    # SizeOfStackCommit: 0x1000
    # SizeOfHeapReserve: 0x100000
    # SizeOfHeapCommit: 0x1000
    # LoaderFlags: 0
    # NumberOfRvaAndSizes: 16
    struct.pack_into("<HBBIIIIIIIIIHHHHHHIIIIHHIIIIII", header, opt_off,
                     0x010B, 14, 0,
                     0x200, 0x400, 0,
                     0x1000, 0x1000, 0x2000,
                     0x00400000, 0x1000, 0x200,
                     6, 0, 1, 0, 6, 0,
                     0, 0x3000, 0x400, 0,
                     2, 0x8140,
                     0x100000, 0x1000, 0x100000, 0x1000,
                     0, 16)
    
    # Data Directories (16 entries, each 8 bytes: RVA, Size)
    # Index 1: Import Directory (RVA = 0x2000 + idt_off, Size = 60 bytes)
    # Index 12: IAT (RVA = 0x2000 + iat_user32_off, Size = 32 bytes)
    dirs_off = opt_off + 96
    # Directory 1 (Import):
    struct.pack_into("<II", header, dirs_off + 1 * 8, 0x2000 + idt_off, 60)
    # Directory 12 (IAT):
    struct.pack_into("<II", header, dirs_off + 12 * 8, 0x2000 + iat_user32_off, 32)
    
    # Section Headers (starts after Optional Header: opt_off + 224)
    sec_off = opt_off + 224
    
    # Section 1: .text
    # Name: ".text\0\0\0"
    # VirtualSize: 0x100
    # VirtualAddress: 0x1000
    # SizeOfRawData: 0x200
    # PointerToRawData: 0x400
    # PointerToRelocations: 0, PointerToLinenumbers: 0
    # NumberOfRelocations: 0, NumberOfLinenumbers: 0
    # Characteristics: 0x60000020 (IMAGE_SCN_CNT_CODE | IMAGE_SCN_MEM_EXECUTE | IMAGE_SCN_MEM_READ)
    header[sec_off:sec_off+8] = b".text\x00\x00\x00"
    struct.pack_into("<IIIIIIHHI", header, sec_off + 8,
                     0x100, 0x1000, 0x200, 0x400,
                     0, 0, 0, 0, 0x60000020)
    
    # Section 2: .rdata
    # Name: ".rdata\0\0"
    # VirtualSize: 0x300
    # VirtualAddress: 0x2000
    # SizeOfRawData: 0x400
    # PointerToRawData: 0x600
    # Characteristics: 0x40000040 (IMAGE_SCN_CNT_INITIALIZED_DATA | IMAGE_SCN_MEM_READ)
    sec2_off = sec_off + 40
    header[sec2_off:sec2_off+8] = b".rdata\x00\x00"
    struct.pack_into("<IIIIIIHHI", header, sec2_off + 8,
                     0x300, 0x2000, 0x400, 0x600,
                     0, 0, 0, 0, 0x40000040)
    
    # Combine all parts
    pe_file = header + text_section + rdata
    
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(pe_file)
        
    print(f"Successfully generated Windows PE executable at: {output_path} ({len(pe_file)} bytes)")

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "dist-win/NovaCut-Studio-Installer.exe"
    build_windows_pe_exe(out)
