<script>
export function colorize(clazz){
    const tb = $(clazz);
    if (tb.length < 1){
        return setTimeout(()=>colorize(clazz), 300);
    }
    tb.find("tr td .v-chip:not(.ar-status)").each(function(){
        let tr = this;
        while( tr ){
            tr = tr.parentNode;
            if ('TR' === tr.tagName){
                $(tr).addClass("ar-bad");
                break;
            }
        }
    });
};  //_colorize

    
const renow = new RegExp(`^(${ $moment().format('DD.MM.YYYY') })+\s`);

export default {
    methods: {
        format(n, digits = 2){
            if ( n ){
                var n = Number(n);
                return Number.isNaN(n) ? '' : new Intl.NumberFormat("ru-RU", {minimumFractionDigits: digits}).format(n);
            }
            return '';
        },
        dtformat(d){
            if (d){
                return $moment(d).format('DD.MM.YYYY HH:mm').replace(renow);
            }
            return '';
        },
        refresh(){
            refreshNuxtData('company');
        }
    }
}    
</script>
