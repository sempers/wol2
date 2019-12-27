//-------------- WEEK MODEL ----------------//
export class WeekModel {
    allowedPNG() {return ['ng', 'dr', 'buy', 'mov', 'games', 'zz', 'soc', 'major', 'interview', 'quit', 'qbb', 'buh', 'acid', 'crush', 'meet', 'breakup', 'ill', 'sex', 'love', 'exam', 'gig', 'bad', 'death', 'sea', 'abroad']}

    constructor(startMoment, weekNum, info, spans) {
        const NOWTIME   = (new Date()).getTime();
        this.startTime  = startMoment._d.getTime();
        const endMoment = startMoment.clone().add(1, 'week').subtract(1, 'second');
        this.endTime    = endMoment._d.getTime();

        this.year          = endMoment.isoWeekYear();   //год
        this.yearNum       = endMoment.isoWeek();       //номер недели в году
        this.weekNum       = weekNum;                //номер недели в жизни
        this.flags         = ""; //флаги
        this.span_ids      = [];
        this.colored_flags = [];                //комбинация
        this.info          = info;              //инфо
        this.desc          = `${this.yearNum} / ${this.weekNum} неделя: ${startMoment.format('L')} — ${endMoment.format('L')}`; //декскрипшн - статический
        this.messages      = [];                //сообщения
        this.msgCount      = 0;
        this.selected      = false;
        this.tagged        = false;
        this.future        = "";                //признак что будущее
        this.msgLoading    = false;             //загрузка сообщений

        if (this.startTime > NOWTIME) {
            this.future  = "future";
            this.bgStyle = "";
            this.bgcolor = "white";
        } else {
            for (let i = 0; i < spans.length; i++) {
                const span = spans[i];
                if (span.startTime >= this.startTime && span.startTime <= this.endTime ||   //Начало спэна попадает
                    span.endTime >= this.startTime && span.endTime <= this.endTime ||       //Конец спэна попадает
                    span.startTime < this.startTime && span.endTime >= this.endTime) {      //спэн безусловно шире данной недели
                    this.flags += `[${span.name}]`;
                    this.span_ids.push(span.id);
                    let colored_flag = {
                        name: span.name,
                        color: span.color
                    };
                    this.colored_flags.push(colored_flag);
                }
            }
            //конструируем цвет согласно спэнам - NEWSTYLE
           /* if (this.span_ids.length === 0)
                this.bgStyle = "nospan";
            else if (this.span_ids.length === 1)
                this.bgStyle = this.span_ids[0];
            else {
                this.span_ids.sort();
                this.bgStyle = this.span_ids.join("_");
            }*/

            if (this.colored_flags.length === 0) {
                this.bgcolor = "#cccccc";
            } else if (this.colored_flags.length == 1) {
                    this.bgcolor = this.colored_flags[0].color;
                } else {
                    this.bgcolor = this.colored_flags[0].color;
                    this.bgcolor2 = this.colored_flags[1].color;
                }
        }

        this.leftpx = (this.yearNum - 1) * 20 + 60; //горизонтальная координата
    }

    getTags(options) {
        options       = options || {stripped: false, asstring: false};
        if (this.info.indexOf("#") < 0)
            return [];
        else {
            let tagnames = [];
            let _tag;
            const re     = (/#([a-z]+)/g);
            while ((_tag = re.exec(this.info))) {
                let _tagname = _tag[1];
                if (!options.hasPng || this.allowedPNG().includes(_tagname))
                    tagnames.push((options.stripped ? "" : "#") + _tagname);
            }
            return options.asstring ? tagnames.join(" ") : tagnames;
        }
    }

    hasTag(tag) {
        return this.info.includes(tag);
    }
}