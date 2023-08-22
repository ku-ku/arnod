import { reactive } from "vue";
import { getvehicle, getorders, getincome } from "~/services/driver";
import { orderstatuses } from "~/services/other";
import { profile } from "app-ext/composables/profile";

export const all = reactive({
    user: computed(()=>{
        return profile.subject;
    }),
    /** 
     * period for all
     */
    period: {
        start: new Date(),
        end:   new Date()
    },
    /**
     * Vehicle by user
     */
    vehicle:  null,
    /**
     * All orders for user
     */
    orders:   null,
    /**
     * Active order for details page & etc
     */
    order:    null,
    /** 
     * Order statuses -> refs/vehicle_order_statuses
     */
    statuses: null,
    /**
     * Salary
     */
    income: {days:[], sum: 0},
    
    /**
     * 
     * @param {Object} item to set: {order: o}
     * @returns void
     */
    set(item){
        Object.keys(item).forEach( k => {
            all[k] = item[k];
        });
    },
    
    async getvehicle(){
        all.vehicle = await getvehicle();
        return all.vehicle;
    },
    async getorders(){
        all.orders = await getorders();
        if ( all.vehicle ){
            all.orders?.forEach( o => {
                if (!all.vehicle.maxCapacity){
                    return;
                }
                o.pcloaded = Math.round(( o.loaded / all.vehicle.maxCapacity ) * 100) - 100;
            });
        }
        return all.orders;
    },
    async getincome(){
        all.income = await getincome();
        all.income.loaded = true;
        return all.income;
    },
    
    async getstatuses(){
        all.statuses = await orderstatuses();
        return all.statuses;
    }
});
