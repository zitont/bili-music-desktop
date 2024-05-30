!define MUI_LANGUAGE "Chinese"
Unicode true

!include nsDialogs.nsh
!include LogicLib.nsh

#OutFile nsDialogs.exe
#RequestExecutionLevel user
#ShowInstDetails show

Var Dialog
Var apiUrl
Var other1
Var other2
Var other3
Var other4
Var skipSet

Page custom pgPageCreate pgPageLeave

Function pgPageCreate

    nsDialogs::Create 1018
    Pop $Dialog

    ${If} $Dialog == error
        Abort
    ${EndIf}

    ${NSD_CreateGroupBox} 10% 10u 80% 100u "接入地址配置"
    Pop $0

        ${NSD_CreateLabel} 20% 26u 20% 10u "接入地址:"
        Pop $0

        ${NSD_CreateText} 40% 24u 40% 12u ""
        Pop $apiUrl

        ${NSD_CreateLabel} 20% 40u 20% 10u "其他配置1:"
        Pop $0

        ${NSD_CreateText} 40% 38u 40% 12u ""
        Pop $other1

        ${NSD_CreateLabel} 20% 54u 20% 10u "其他配置2:"
        Pop $0

        ${NSD_CreateText} 40% 52u 40% 12u ""
        Pop $other2
        
        ${NSD_CreateLabel} 20% 68u 20% 10u "其他配置3:"
        Pop $0

        ${NSD_CreateText} 40% 66u 40% 12u ""
        Pop $other3

        ${NSD_CreateLabel} 20% 82u 20% 10u "其他配置4:"
        Pop $0

        ${NSD_CreateText} 40% 80u 40% 12u ""
        Pop $other4

        ${NSD_CreateCheckbox} 20% 96u 100% 10u "跳过当前设置"
        Pop $skipSet

    nsDialogs::Show
FunctionEnd

Function PgPageLeave
    ${NSD_GetText} $apiUrl $0
    ${NSD_GetText} $other1 $1
    ${NSD_GetText} $other2 $2
    ${NSD_GetText} $other3 $3
    ${NSD_GetText} $other4 $4
    ${NSD_GetState} $skipSet $6
	;将配置信息写入文件: C：\用户\用户名\AppData\Roaming\demo\config.json
    ${If} $6 == 0
        SetOutPath "$APPDATA\demo"
        CreateDirectory "$APPDATA\demo"
        ;FileOpen $9 $APPDATA\demo\config.json w
        ;FileWrite $9 '{"apiUrl":"$0","other1":"$1","other2":"$2","other3":"$3","other4":"$4"}'
        ;FileClose $9
        ;SetFileAttributes $APPDATA\demo\config.json NORMAL

        StrCpy $0 '{"apiUrl":"$0","other1":"$1","other2":"$2","other3":"$3","other4":"$4"}'
        FileOpen $5 "$APPDATA\demo\config.json" "w"
        FileWrite $5 $0
        FileClose $5
    ${EndIf}

FunctionEnd

Section
SectionEnd
