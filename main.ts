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
            this.sig = m[1]
            this.val = m[2]
        }
        message(): string {
            let msg = this.mod + ";" + this.sig + ";" + this.val
            return msg
        }
        public mod: string
        public sig: string
        public val: string
    }

    ////////////////////
    // EVENT HANDLING //
    ////////////////////

    export type eventHandler = (id: string) => void
    export type onEventHandler = (id: string, value: string) => void

    class Event {
        constructor(module: string, signal: string,
                    handler: onEventHandler) {
            this.mod = module
            this.sig = signal
            this.hnd = handler
        }
        public mod: string
        public sig: string
        public hnd: onEventHandler
    }

    class Events {
        items: Event[]
        constructor() {
            this.items = []
        }
        public register(module: string, signal: string,
                        handler: onEventHandler) {
            let e = new Event(module, signal, handler)
            this.items.push(e)
        }
        public onEvent(module: string, signal: string, value: string) {
            for (let i = 0; i < this.items.length; i++) {
                let item = this.items[i]
                if ((item.mod == module) &&
                    (item.sig == signal)) {
                    item.hnd(module, value)
                    return
                }
            }
        }
        public testEvent(module: string, signal: string, value: string) : boolean {
            for (let i = 0; i < this.items.length; i++)
                if ((this.items[i].mod == module) &&
                    (this.items[i].sig == signal)) {
                    return true
                }
            return false;
        }
    }

    export let events = new Events

    /////////////
    // STARTUP //
    /////////////

    serial.redirect(
        SerialPin.P13,
        SerialPin.P14,
        BaudRate.BaudRate115200
    )

    serial.setRxBufferSize(128)
    serial.setTxBufferSize(128)

    basic.pause(1000)
    serial.writeLine("reset")
    basic.pause(1000)
    basic.showIcon(IconNames.SmallHeart)
    while (serial.readUntil('\n').isEmpty()) { }
    basic.showIcon(IconNames.Heart)

    ///////////////////////////
    // BASIC SIGNAL HANDLING //
    ///////////////////////////

    serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
        let line = serial.readUntil(serial.delimiters(Delimiters.NewLine))
basic.showString(line)
        if (!line.isEmpty()) {
            line = "Et" + line.substr(2) // corrects a fuzzy transmission error
            let msg = new Message( line)
            events.onEvent( msg.mod, msg.sig, msg.val)
        }
    })

    let WAIT = 0

    // 'sendValue' sends a signal to a module
    // in case of an actuator: the signal value is applied
    // in case of a sensor: the signal represents a critical value
    export function sendSignal(module: string, signal: string, value: string) {
        let msg = module + ";" + signal + ";" + value
        // give mbit some time between serial writes
        while (control.millis() < WAIT) basic.pause(1)
        WAIT = control.millis() + 10
        serial.writeLine(msg)
    }

    //////////////////////
    // GENERAL ROUTINES //
    //////////////////////

    //% color="#AA6600"
    //% block="comment: %dummy"
    //% block.loc.nl="uitleg: %dummy"
    //% min.defl="schrijf hier je uitleg"
    export function comment(dummy: string) {
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

    //% block="wait %time sec"
    //% block.loc.nl="wacht %time sec"
    //% time.min=0 time.defl=1
    export function wait(time: number) {
        basic.pause(time * 1000)
    }

    //% block="stop %id"
    //% block.loc.nl="stop %id"
    export function stop(id: string) {
        EtCommon.sendSignal(id, "stop", "true")
    }
}
