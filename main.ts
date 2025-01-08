//% color="#EEAA00" icon="\uf31e"
//% block="ElecTricks"
//% block.loc.nl="ElecTricks"
namespace EtCommon {

    ///////////////
    // MESSAGING //
    ///////////////

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
        messages: Message[]
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

    ////////////////////
    // EVENT HANDLING //
    ////////////////////

    class Event {
        constructor(module: string, signal: string, value: string,
                    handler: eventHandler) {
            this.mod = module
            this.sig = signal
            this.val = value
            this.hnd = handler
        }
        public mod: string
        public sig: string
        public val: string
        public hnd: eventHandler
    }
let x = 0
    class Events {
        items: Event[]
        constructor() {
            this.items = []
        }
        public register(module: string, signal: string, value: string,
                        handler: eventHandler) {
            let e = new Event(module, signal, value, handler)
            this.items.push(e)
        }
        public onEvent(module: string, signal: string, value: string) {
basic.showString("-"+module+"-"+signal+"-"+value+"-")
            for (let i = 0; i < this.items.length; i++) {
                let item = this.items[i]
basic.showString("-"+item.mod+"-"+item.sig+"-"+item.val+"-")
                if ((item.mod == module) &&
                    (item.sig == signal) &&
                    (item.val == value)) {
basic.showNumber(++x)
                    item.hnd(module)
                    return
                }
            }
        }
        public testEvent(module: string, signal: string, value: string) : boolean {
            for (let i = 0; i < this.items.length; i++)
                if ((this.items[i].mod == module) &&
                    (this.items[i].sig == signal) &&
                    (this.items[i].val == value)) {
                    return true
                }
            return false;
        }
    }

    export let events = new Events

    export type eventHandler = (id: string) => void

    /////////////
    // STARTUP //
    /////////////

    serial.redirect(
        SerialPin.P13,
        SerialPin.P14,
        BaudRate.BaudRate115200
    )

    serial.setRxBufferSize(64)
    serial.setTxBufferSize(64)

    // wait until wemos has started
    basic.showIcon(IconNames.SmallHeart)
    while (serial.readUntil('\n').isEmpty()) { }
    basic.showIcon(IconNames.Heart)

    ///////////////////////////
    // BASIC SIGNAL HANDLING //
    ///////////////////////////

    let BUFFER = ""

    serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
        BUFFER = serial.readUntil(serial.delimiters(Delimiters.NewLine))
        if (!BUFFER.isEmpty()) {
            // an event message is not stored
            // instead it is returned to be handled by 'onEvent'
            let msg = g_messages.add(BUFFER)
            BUFFER = ""
            if (msg)
                events.onEvent( msg.mod, msg.sig, msg.val)
        }
    })

    // 'setValue' sends a signal value to a module to be set
    // this applies to actuator modules
    export function setValue(module: string, signal: string, value: string) {
        let msg = module + ";S;" + signal + ";" + value
        serial.writeLine(msg)
    }

    // 'askValue' sends a signal to a module to request its value
    // use 'getValue' to retrieve the value returned by the module
    // this applies to sensor modules
    export function askValue(module: string, signal: string) {
        let msg = module + ";A;" + signal
        serial.writeLine(msg)
    }

    // 'getValue' waits for a signal's value to be returned
    // before a call to 'getValue' the value must be requested by 'askValue'
    // this applies to sensor modules
    export function getValue(module: string, command: string, signal: string): string {
        let val = ""
        do {
            val = g_messages.value(module, command, signal)
            basic.pause(1)  // anable 'onDataReceived' to receive messages meanwhile
        }                   // instead of 'yield', which isn't part of typescript
        while (val.isEmpty())
        return val
    }

    // 'setEventValue' sends an event's critical value to a module
    // after passing the critical value, the module will send an event
    // (note that events are signals too, but accompanied by the command 'E')
    // this applies to sensor modules
    export function setEventValue(module: string, signal: string, value: string) {
        let msg = module + ";E;" + signal + ";" + value
        serial.writeLine(msg)
    }

    //////////////////////
    // GENERAL ROUTINES //
    //////////////////////

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
