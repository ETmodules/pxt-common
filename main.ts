//% color="#EEAA00" icon="\uf31e"
//% block="ElecTricks"
//% block.loc.nl="ElecTricks"
namespace EtCommon {

    export enum Comparison {
        //% block="="
        //% block.loc.nl="="
        COMP_EQ,
        //% block="<>"
        //% block.loc.nl="<>"
        COMP_NEQ,
        //% block=">"
        //% block.loc.nl=">"
        COMP_GT,
        //% block="<"
        //% block.loc.nl="<"
        COMP_LT,
        //% block=">="
        //% block.loc.nl=">="
        COMP_EGT,
        //% block="<="
        //% block.loc.nl="<="
        COMP_ELT
    }

    class Message {
        constructor(msg: string) {
            let m = msg.split(';')
            this.mod = m[0]
            this.cmd = m[1]
            this.sig = m[2]
            this.val = m[3]
        }
        message(): string {
            let msg = this.mod + ";" + this.cmd + ";" + this.sig + ";" + this.val
            return msg
        }
        public mod: string
        public cmd: string
        public sig: string
        public val: string
    }

    class Messages {
        public messages: Message[]
        constructor() {
            this.messages = []
        }
        add(msg: string): Message {
            let m = new Message(msg)
            if (m.cmd == "E")
                return m // do not store events
            this.messages.push(m)
            return null
        }
        at(index: number): Message {
            return this.messages[index]
        }
        value(module: string, command: string, signal: string): string {
            for (let i: number = 0; i < this.messages.length; i++) {
                let m = this.messages[i]
                if (!m) continue
                if (m.mod == module && m.cmd == command && m.sig == signal) {
                    this.messages.removeAt(i)
                    return m.val
                }
                else // cleanup corrupt messages
                    if (m.mod.isEmpty() || !m.cmd.isEmpty() || m.sig.isEmpty())
                        this.messages.removeAt(i)
            }
            return ""
        }
    }

    let g_messages = new Messages

    export type eventHandler = (id: string) => void
    export type eventItem = { handler: eventHandler, module: string, signal: string }
    export let eventArray: eventItem[] = []

    function callEvent(module: string, signal: string) {
        eventArray.forEach((item) => {
            if (item.module == module && item.signal == signal)
                item.handler(module)
        })
    }

    serial.redirect(
        SerialPin.P13,
        SerialPin.P14,
        BaudRate.BaudRate115200
    )

    serial.setRxBufferSize(64)
    serial.setTxBufferSize(64)

    let BUFFER = ""

    serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
        BUFFER = serial.readUntil(serial.delimiters(Delimiters.NewLine))
        if (!BUFFER.isEmpty()) {
            // an event message is not stored
            // instead it is returned to be handled by 'callEvent'
            let msg = g_messages.add(BUFFER)
            BUFFER = ""
            if (msg)
                callEvent(msg.mod, msg.sig)
        }
    })

    // wait until wemos is started
    basic.showIcon(IconNames.SmallHeart)
    while (serial.readUntil('\n').isEmpty()) { }
    basic.showIcon(IconNames.Heart)

    export function getValue(module: string, command: string, signal: string): string {
        let val = ""
        do {
            val = g_messages.value(module, command, signal)
            basic.pause(1)  // anable 'onDataReceived' to receive a message
        }                   // instead of 'yield' which isn't part of typescript
        while (val.isEmpty())
        return val
    }

    export function setValue(module: string, signal: string, value: string) {
        let msg = module + ";S;" + signal + ";" + value
        serial.writeLine(msg)
    }

    export function askValue(module: string, signal: string) {
        let msg = module + ";A;" + signal
        serial.writeLine(msg)
    }

    export function compareValue(module: string, signal: string, value: string,
        comp: Comparison) {
        let msg = module + ";C;" + signal + ";" + value
        switch (comp) {
            case Comparison.COMP_EQ: msg += "==|"; break;
            case Comparison.COMP_NEQ: msg += "!=|"; break;
            case Comparison.COMP_GT: msg += ">|"; break;
            case Comparison.COMP_LT: msg += "<|"; break;
            case Comparison.COMP_EGT: msg += ">=|"; break;
            case Comparison.COMP_ELT: msg += "<=|"; break;
        }
        serial.writeLine(msg)
    }

    export function waitValue(module: string, signal: string,
        value: string, comp: Comparison) {
        let msg = module + ";W;" + signal + ";" + value
        switch (comp) {
            case Comparison.COMP_EQ: msg += "==|"; break;
            case Comparison.COMP_NEQ: msg += "!=|"; break;
            case Comparison.COMP_GT: msg += ">|"; break;
            case Comparison.COMP_LT: msg += "<|"; break;
            case Comparison.COMP_EGT: msg += ">=|"; break;
            case Comparison.COMP_ELT: msg += "<=|"; break;
        }
        serial.writeLine(msg)
    }

    //% block="a number from %min utai %max"
    //% block.loc.nl="een getal van %min t/m %max"
    //% min.defl=0 max.defl=10
    export function randomInt(min: number, max: number): number {
        let i = 0
        if (min > max) {
            i = min
            min = max
            max = i
        }
        i = max - min + 1
        i = min + Math.floor(Math.random() * i)
        return i
    }

    //% block="all modules"
    //% block.loc.nl="alle modules"
    export function all(): string {
        return "ALL"
    }

    //% block="stop %id"
    //% block.loc.nl="stop %id"
    export function stop(id: string) {
        EtCommon.setValue(id, "stop", "true")
    }

    //% block="wait %time sec"
    //% block.loc.nl="wacht %time sec"
    //% min.defl=1
    export function wait(time: number) {
        basic.pause(time * 1000)
    }

    //% color="#AA6600"
    //% block="comment: %dummy"
    //% block.loc.nl="uitleg: %dummy"
    //% min.defl="schrijf hier je uitleg"
    export function comment(dummy: string) {
    }
}
