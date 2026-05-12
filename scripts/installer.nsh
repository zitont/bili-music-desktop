!define MUI_LANGUAGE "SimpChinese"
Unicode true

!include nsDialogs.nsh
!include LogicLib.nsh

Var Dialog
Var DataDirInput
Var DataDirBrowse
Var DataDefaultRadio
Var DataCustomRadio

; 数据目录选择页面
Page custom pgDataDirCreate pgDataDirLeave

Function pgDataDirCreate
    nsDialogs::Create 1018
    Pop $Dialog

    ${If} $Dialog == error
        Abort
    ${EndIf}

    ; 页面标题
    ${NSD_CreateLabel} 0 0 100% 20u "选择数据存储位置"
    Pop $0
    CreateFont $1 "Microsoft YaHei" 10 700
    SendMessage $0 ${WM_SETFONT} $1 0

    ; 说明文本
    ${NSD_CreateLabel} 0 24u 100% 30u "Bili Music 的歌单数据库将存储在所选目录下。$\r$\n建议使用默认位置，便于备份和迁移。"
    Pop $0

    ; 默认位置选项
    ${NSD_CreateRadioButton} 0 60u 100% 12u "使用默认数据目录（推荐）"
    Pop $DataDefaultRadio
    SendMessage $DataDefaultRadio ${BM_SETCHECK} ${BST_CHECKED} 0

    ${NSD_CreateLabel} 16u 74u 90% 12u "$APPDATA\bili-music-desktop\data"
    Pop $0
    CreateFont $1 "Consolas" 8 0
    SendMessage $0 ${WM_SETFONT} $1 0

    ; 自定义位置选项
    ${NSD_CreateRadioButton} 0 94u 100% 12u "自定义数据目录"
    Pop $DataCustomRadio

    ${NSD_CreateDirRequest} 16u 110u 70% 12u ""
    Pop $DataDirInput
    EnableWindow $DataDirInput 0

    ${NSD_CreateBrowseButton} 88% 110u 12% 12u "浏览..."
    Pop $DataDirBrowse
    EnableWindow $DataDirBrowse 0

    ; 绑定事件
    ${NSD_OnClick} $DataDefaultRadio onDefaultClick
    ${NSD_OnClick} $DataCustomRadio onCustomClick

    nsDialogs::Show
FunctionEnd

Function onDefaultClick
    EnableWindow $DataDirInput 0
    EnableWindow $DataDirBrowse 0
FunctionEnd

Function onCustomClick
    EnableWindow $DataDirInput 1
    EnableWindow $DataDirBrowse 1
FunctionEnd

Function pgDataDirLeave
    ${NSD_GetState} $DataCustomRadio $0

    ${If} $0 == ${BST_CHECKED}
        ${NSD_GetText} $DataDirInput $1
        ${If} $1 == ""
            MessageBox MB_ICONEXCLAMATION "请选择或输入数据目录路径。"
            Abort
        ${EndIf}
        ; 将自定义数据目录写入安装目录的配置文件
        FileOpen $5 "$INSTDIR\data-dir.cfg" "w"
        FileWrite $5 "$1"
        FileClose $5
    ${EndIf}
FunctionEnd

Section
SectionEnd
