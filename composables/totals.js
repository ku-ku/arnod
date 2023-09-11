import { ref } from "vue";
import { gettotals } from "~/services/company";

export const totals = ref({
    period: {start: 0, end: 0},
    gross: 0, 
    expenses: 0, 
    expenses_driver: 0, 
    expenses_driver_vat: 0, 
    actual_fuel_expenses: 0, 
    estimated_fuel_expenses: 0, 
    reported_fuel_expenses: 0, 
    profit: 0,
    incSlr: true,
    slrMode: 3,
    incSlrSlr: computed({
        get(){
            return (totals.value.incSlr) && ( (totals.value.slrMode & 1) == 1 );
        },
        set(val){
            if (val){
                totals.value.slrMode = totals.value.slrMode | 1;
            } else {
                totals.value.slrMode &= ~1;
            }
            totals.value.at = (new Date()).getTime();
        }
    }),
    incSlrVat: computed({
        get(){
            return (totals.value.incSlr) && ( (totals.value.slrMode & 2) == 2 );
        },
        set(val){
            if (val){
                totals.value.slrMode = totals.value.slrMode | 2;
            } else {
                totals.value.slrMode &= ~2;
            }
            totals.value.at = (new Date()).getTime();
        }
    }),
    incFuel: true,
    fuelMode: 0,
    incFuelActual: computed({
        get(){
            return (totals.value.incFuel) && (0 === totals.value.fuelMode);
        },
        set(val){
            if (val){
                totals.value.fuelMode = 0;
            }
            totals.value.at = (new Date()).getTime();
        }
    }),
    incFuelEst: computed({
        get(){
            return (totals.value.incFuel) && (1 === totals.value.fuelMode);
        },
        set(val){
            if (val){
                totals.value.fuelMode = 1;
            }
        }
    }),
    incFuelRep: computed({
        get(){
            return (totals.value.incFuel) && (2 === totals.value.fuelMode);
        },
        set(val){
            if (val){
                totals.value.fuelMode = 2;
            }
        }
    }),
    totalExp: computed(()=>{
        let t = totals.value.expenses || 0;
        if ( totals.value.incSlrSlr ){
            t += totals.value.expenses_driver || 0;
        }
        if ( totals.value.incSlrVat ){
            t += totals.value.expenses_driver_vat || 0;
        }
        if ( totals.value.incFuelActual ){
            t += totals.value.actual_fuel_expenses || 0;
        } else if (totals.value.incFuelEst){
            t += totals.value.estimated_fuel_expenses || 0;
        } else if (totals.value.incFuelRep){
            t += totals.value.reported_fuel_expenses || 0;
        }
        totals.value.at = (new Date()).getTime();
        return Math.round(t*100)/100;
    }),
    totalProfit: computed(()=>{
        return (totals.value.gross||0) - totals.value.totalExp;
    }),
    prev: {
        gross: 0,
        expenses: 0,
        expenses_driver: 0, 
        expenses_driver_vat: 0, 
        actual_fuel_expenses: 0, 
        estimated_fuel_expenses: 0, 
        reported_fuel_expenses: 0, 
        totalExp: computed(()=>{
            let t = totals.value.prev.expenses || 0;
            if ( totals.value.incSlrSlr ){
                t += totals.value.prev.expenses_driver || 0;
            }
            if ( totals.value.incSlrVat ){
                t += totals.value.prev.expenses_driver_vat || 0;
            }
            if ( totals.value.incFuelActual ){
                t += totals.value.prev.actual_fuel_expenses || 0;
            } else if (totals.value.incFuelEst){
                t += totals.value.prev.estimated_fuel_expenses || 0;
            } else if (totals.value.incFuelRep){
                t += totals.value.prev.reported_fuel_expenses || 0;
            }
            return t;
        }),
        totalProfit: computed(()=>{
            return (totals.value.prev.gross||0) - totals.value.prev.totalExp;
        }),
        days: 30,
        loaded: false
    },
    pc: q => {
        if ( !totals.value.prev.loaded ){
            return null;
        }

        let now = new Date(),
            period = totals.value.period,
            base = Number(totals.value.prev[q]) || 0,
            current = Number(totals.value[q]) || 0,
            k = ( now.getMonth() === period.start.getMonth() ) 
                    ? now.getDate()/totals.value.prev.days 
                    : 1;

        base = base * k;
        if (base > 0){
            let pc = current/base * 100;
            if ( pc > 100 ){
                pc = pc - 100;
            } else {
                pc = - (100 - pc);
            }
            return Number(pc).toFixed(1);
        }
        return null;
    },
    at: 0,
    pending: false,
    error: null,
    async load(period){
        totals.value.period = period;
        totals.value.error = null;
        totals.value.pending = true;
        try {
            const res = await gettotals(period.start, period.end);
                Object.keys(res).forEach(k => totals.value[k] = res[k]);
                let d2 = $moment(period.start).add(-1, 'months'),
                    d3 = $moment(period.end).add(-1, 'months');
                gettotals(d2.toDate(), d3.toDate()).then( prev => {
                    Object.keys(prev).forEach(k => totals.value.prev[k] = prev[k]);
                    totals.value.prev.days = d3.diff(d2, 'days');
                    totals.value.prev.loaded = true;
                    console.log('at prev', d2, totals.value.prev);
                }).catch(e => {
                    console.log('ERR (totals prev)', e);
                });
        } catch(e){
            console.log('ERR (totals)', e);
            totals.value.error = e;
        } finally {
            totals.value.at = (new Date()).getTime();
            totals.value.pending = false;
        }
    }
});
