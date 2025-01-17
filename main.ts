//% color="#EEAA00" icon="\uf31e"
//% block="ElecTricks"
//% block.loc.nl="ElecTricks"
namespace EtCommon {

    let GROUP = 0

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

    // wait until wemos has started
    basic.showIcon(IconNames.SmallHeart)
    while (serial.readUntil('\n').isEmpty()) { }
    basic.showIcon(IconNames.Heart)

    ///////////////////////////
    // BASIC SIGNAL HANDLING //
    ///////////////////////////

    serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
        let line = serial.readUntil(serial.delimiters(Delimiters.NewLine))
        line = "Et" + line.substr( 2) // corrects a fuzzy transmission error
        if (!line.isEmpty()) {
            let msg = new Message( line)
            events.onEvent( msg.mod, msg.sig, msg.val)
        }
    })

    radio.onReceivedNumber(function(receivedNumber: number) {
        switch (receivedNumber) {
            case Gamepad.Button1: if (EventGamepad1) EventGamepad1(); break;
            case Gamepad.Button2: if (EventGamepad2) EventGamepad2(); break;
            case Gamepad.Button3: if (EventGamepad3) EventGamepad3(); break;
            case Gamepad.Button4: if (EventGamepad4) EventGamepad4(); break;
            case Gamepad.Button5: if (EventGamepad5) EventGamepad5(); break;
            case Gamepad.Button6: if (EventGamepad6) EventGamepad6(); break;
            case Gamepad.Button7: if (EventGamepad7) EventGamepad7(); break;
            case Gamepad.Button8: if (EventGamepad8) EventGamepad8(); break;
            case Gamepad.Button9: if (EventGamepad9) EventGamepad9(); break;
            case Gamepad.Button10: if (EventGamepad10) EventGamepad10(); break;
            case Gamepad.Button11: if (EventGamepad11) EventGamepad11(); break;
            case Gamepad.Button12: if (EventGamepad12) EventGamepad12(); break;
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

    //% block="join %group"
    //% block.loc.nl="sluit aan bij %group"
    export function setGroup(group: Group) {
        GROUP = group + 1
        radio.setGroup(GROUP)
    }

    //% block="stop %id"
    //% block.loc.nl="stop %id"
    export function stop(id: string) {
        EtCommon.sendSignal(id, "stop", "true")
    }
}
