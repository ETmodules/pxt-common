//% color="#EEAA00" icon="\uf31e"
//% block="ElecTricks"
//% block.loc.nl="ElecTricks"
namespace EtCommon {

    /////////////////////
    // GAMEPAD SUPPORT //
    /////////////////////

    export enum Button {
        //% block="black-top"
        //% block.loc.nl="zwart-boven"
        Button1,
        //% block="black-bottom"
        //% block.loc.nl="zwart-onder"
        Button2,
        //% block="black-left"
        //% block.loc.nl="zwart-links"
        Button3,
        //% block="black-right"
        //% block.loc.nl="zwart-rechts"
        Button4,
        //% block="white-top"
        //% block.loc.nl="wit-boven"
        Button5,
        //% block="white-bottom"
        //% block.loc.nl="wit-onder"
        Button6,
        //% block="white-left"
        //% block.loc.nl="wit-links"
        Button7,
        //% block="white-right"
        //% block.loc.nl="wit-rechts"
        Button8,
        //% block="yellow-top"
        //% block.loc.nl="geel-boven"
        Button9,
        //% block="yellow-bottom"
        //% block.loc.nl="geel-onder"
        Button10,
        //% block="blue"
        //% block.loc.nl="blauw"
        Button11,
        //% block="red"
        //% block.loc.nl="rood"
        Button12
    }

    export type gamepadHandler = () => void

    let EventGamepad1: gamepadHandler
    let EventGamepad2: gamepadHandler
    let EventGamepad3: gamepadHandler
    let EventGamepad4: gamepadHandler
    let EventGamepad5: gamepadHandler
    let EventGamepad6: gamepadHandler
    let EventGamepad7: gamepadHandler
    let EventGamepad8: gamepadHandler
    let EventGamepad9: gamepadHandler
    let EventGamepad10: gamepadHandler
    let EventGamepad11: gamepadHandler
    let EventGamepad12: gamepadHandler

    export enum Group {
        //% block="group 1"
        //% block.loc.nl="groep 1"
        Group1,
        //% block="group 2"
        //% block.loc.nl="groep 2"
        Group2,
        //% block="group 3"
        //% block.loc.nl="groep 3"
        Group3,
        //% block="group 4"
        //% block.loc.nl="groep 4"
        Group4,
        //% block="group 5"
        //% block.loc.nl="groep 5"
        Group5,
        //% block="group 6"
        //% block.loc.nl="groep 6"
        Group6,
        //% block="group 7"
        //% block.loc.nl="groep 7"
        Group7,
        //% block="group 8"
        //% block.loc.nl="groep 8"
        Group8,
        //% block="group 9"
        //% block.loc.nl="groep 9"
        Group9
    }

    let GROUP = 0

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
        events: Message[]
        constructor() {
            this.messages = []
            this.events = []
        }
        add(msg: string) {
            let m = new Message(msg)
basic.showString(m.cmd)
            if (m.cmd == "E")
                this.events.push(m)
            else
                this.messages.push(m)
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
        event() : Message {
            if ( this.events.length ) {
                let msg: Message = this.events[0]
                this.events.removeAt(0)
                return msg
            }
            return null
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
            for (let i = 0; i < this.items.length; i++) {
                let item = this.items[i]
                if ((item.mod == module) &&
                    (item.sig == signal) &&
                    (item.val == value)) {
basic.showString("H")
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

    serial.setRxBufferSize(128)
    serial.setTxBufferSize(128)

    // wait until wemos has started
    basic.showIcon(IconNames.SmallHeart)
    while (serial.readUntil('\n').isEmpty()) { }
    basic.showIcon(IconNames.Heart)

    ///////////////////////////
    // BASIC SIGNAL HANDLING //
    ///////////////////////////

    let BUFFER = ""
    let LOCK = false

    serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
        BUFFER = serial.readUntil(serial.delimiters(Delimiters.NewLine))
        BUFFER = "Et" + BUFFER.substr( 2) // corrects a fuzzy transmission error
basic.showString("+")
        if (!BUFFER.isEmpty()) {
            while (LOCK) pause(1)
            LOCK = true
            g_messages.add(BUFFER)
            LOCK = false
            BUFFER = ""
        }
    })

    basic.forever(function() {
        while (LOCK) pause(1)
        LOCK = true
basic.showString("L")
        let msg = g_messages.event()
basic.showString("U")
        LOCK = false
        if (msg) {
basic.showString("-")
            events.onEvent(msg.mod, msg.sig, msg.val)
        }
    })

    radio.onReceivedNumber(function(receivedNumber: number) {
        switch (receivedNumber) {
            case Button.Button1: if (EventGamepad1) EventGamepad1(); break;
            case Button.Button2: if (EventGamepad2) EventGamepad2(); break;
            case Button.Button3: if (EventGamepad3) EventGamepad3(); break;
            case Button.Button4: if (EventGamepad4) EventGamepad4(); break;
            case Button.Button5: if (EventGamepad5) EventGamepad5(); break;
            case Button.Button6: if (EventGamepad6) EventGamepad6(); break;
            case Button.Button7: if (EventGamepad7) EventGamepad7(); break;
            case Button.Button8: if (EventGamepad8) EventGamepad8(); break;
            case Button.Button9: if (EventGamepad9) EventGamepad9(); break;
            case Button.Button10: if (EventGamepad10) EventGamepad10(); break;
            case Button.Button11: if (EventGamepad11) EventGamepad11(); break;
            case Button.Button12: if (EventGamepad12) EventGamepad12(); break;
        }
    })

    let WAIT = 0
    function sendData(data: string)
    {
        // give mbit some time between serial writes
        while (control.millis() < WAIT) basic.pause(1)
        WAIT = control.millis() + 10
        serial.writeLine(data)
    }

    // 'setValue' sends a signal value to a module to be set
    // this applies to actuator modules
    export function setValue(module: string, signal: string, value: string) {
        let msg = module + ";S;" + signal + ";" + value
        sendData(msg)
    }

    // 'askValue' sends a signal to a module to request its value
    // use 'getValue' to retrieve the value returned by the module
    // this applies to sensor modules
    export function askValue(module: string, signal: string) {
        let msg = module + ";A;" + signal
basic.showString("a")
        sendData(msg)
    }

    // 'getValue' waits for a signal's value to be returned
    // before a call to 'getValue' the value must be requested by 'askValue'
    // this applies to sensor modules
    export function getValue(module: string, command: string, signal: string): string {
        let val = ""
basic.showString("g")
        do {
            while (LOCK) pause(1)
            LOCK = true
            val = g_messages.value(module, command, signal)
            LOCK = false
            basic.pause(100)
        }
        while (val.isEmpty())
basic.showString("v")
        return val
    }

    // 'setEventValue' sends an event's critical value to a module
    // after passing the critical value, the module will send an event
    // (note that events are signals too, but accompanied by the command 'E')
    // this applies to sensor modules
    export function setEventValue(module: string, signal: string, value: string) {
        let msg = module + ";E;" + signal + ";" + value
        sendData(msg)
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
    //% min.defl=1
    export function wait(time: number) {
        basic.pause(time * 1000)
    }

    //% block="join %group"
    //% block.loc.nl="sluit aan bij %group"
    export function setGroup(group: Group) {
        GROUP = group + 1
        radio.setGroup(GROUP)
    }

    //% block="when %button is pressed on gamepad"
    //% block.loc.nl="wanneer op de gamepad %button wordt ingedrukt"
    export function onGamepad(button: Button, programmableCode: () => void): void {
        switch (button) {
            case Button.Button1: EventGamepad1 = programmableCode; break;
            case Button.Button2: EventGamepad2 = programmableCode; break;
            case Button.Button3: EventGamepad3 = programmableCode; break;
            case Button.Button4: EventGamepad4 = programmableCode; break;
            case Button.Button5: EventGamepad5 = programmableCode; break;
            case Button.Button6: EventGamepad6 = programmableCode; break;
            case Button.Button7: EventGamepad7 = programmableCode; break;
            case Button.Button8: EventGamepad8 = programmableCode; break;
            case Button.Button9: EventGamepad9 = programmableCode; break;
            case Button.Button10: EventGamepad10 = programmableCode; break;
            case Button.Button11: EventGamepad11 = programmableCode; break;
            case Button.Button12: EventGamepad12 = programmableCode; break;
        }
    }

    //% block="stop %id"
    //% block.loc.nl="stop %id"
    export function stop(id: string) {
        EtCommon.setValue(id, "stop", "true")
    }
}
