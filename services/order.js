import { phpdate2m, date2php } from "app-ext/utils";

export async function getorders(filters){
    const res = await $jet.api({
        url: '/organizations_order/filtered',
        method: 'POST',
        key: 'company-orders',
        params: {
            include: 'order',
            perPage: 1000
        },
        body: {
            filters
        }
    });
    if (res.success){
        res.result.items.forEach( item => {
            item.order.period = `${ phpdate2m(item.order.loading_start_date).format('DD.MM.YYYY') }-${ phpdate2m(item.order.unloading_start_date).format('DD.MM.YYYY') }`;
            item.distributed_cargo_count = Number(item.distributed_cargo_count).toFixed(2);
            item.executed_cargo_count = Number(item.executed_cargo_count).toFixed(2);
            if ( item.order.cargo_units_count ){
                item.order.cargo_units_count = Number(item.order.cargo_units_count).toFixed(2);
                item.order.pc_distributed = Math.trunc( (item.distributed_cargo_count / item.order.cargo_units_count)*100 );
                item.order.pc_executed = Math.trunc( (item.executed_cargo_count / item.order.cargo_units_count)*100 );
            }
        });
        return res.result.items;
        
    } else {
        throw res.error;
    }
};   //getorders

export async function getorderhst(filters){
    const res = await $jet.api({
        url: '/vehicle_orders',
        method: 'GET',
        params: {
            include: 'vehicle',
            page: 1,
            perPage: 1000,
            orders: '-start_date',
            filters
        }
    });
    
    if (res.success){
        const now = new Date();
        res.result.items.forEach( item => {
            item.at = phpdate2m(item.start_date).format('DD.MM.YYYY');
            item.driver = item.driver?.user?.full_name;
            item.diffCapacity = 0;
            item.loaded = Number(item.loaded);
            if (item.vehicle){
                item.$vehicle = item.vehicle.reg_number;
                if ( item.vehicle.trailers?.length > 0 ){
                    item.$vehicle += ' / ' + item.vehicle.trailers.map( t => t.reg_number ).join(',');
                }
                if (item.vehicle.trailers?.length > 0) {
                    let trailer = item.vehicle.trailers.at(0);
                    item.capacity = parseInt(trailer.pivot.vehicle_load_capacity?.weight || 0, 10);
                    item.capacity-= item.vehicle.weight || 0;
                    item.capacity-= trailer.weight || 0;
                    item.capacity = Number( ((item.capacity > 0) ? item.capacity : 0) / 1000 ).toFixed(1);
                    item.diffCapacity = (item.loaded) ? Number(((item.loaded - item.capacity) * 100) / item.capacity).toFixed(1) : 0;
                } else {
                    item.capacity = 'нет сцепки';
                }
            }
            item.start = phpdate2m(item.start_date);
            item.end   = phpdate2m(item.end_date);
            item.period = `${ item.start.format('DD.MM.YYYY') } - ${item.end.format('DD.MM.YYYY')}`;
            item.start = item.start.toDate();
            item.end   = item.end.toDate();
            
            item.tonnage= `${item.cargo_count}/${item.loaded || 'нд'}/${item.unloaded || 'нд'}`;
            if (item.last_status && item.last_status.pivot) {
                item.status = item.last_status.title;
                item.dt = phpdate2m(item.last_status.pivot.start_date);
                let duru = $moment.duration( $moment(now).diff(item.dt) );
                if ( duru.months() > 0 ){
                    item.duru = `${ duru.months() > 0 ? duru.months() + ' мес. ' : '' } 
                                 ${ duru.days()   > 0 ? duru.days()   + ' дн. ' : '' }`;
                } else {
                    item.duru = `${ duru.days()   > 0 ? duru.days()   + ' дн. ' : '' }
                                 ${ duru.hours()  > 0 ? duru.hours()  + ' ч. ' : ''} 
                                 ${ duru.minutes() } мин.`;
                }
            }
        });
        return res.result.items;
    } else {
        throw res.error;
    }
}   //getorderhst


export async function savetrip(trip){
    const body = {
        start_date: date2php(trip.start),
        end_date:   date2php(trip.end),
        cargo_count: trip.cargo_count,
        driver_id:   trip.driver_id,
        organization_order: {id: trip.order_id},
        vehicle: {id: trip.vehicle_id}
    };
    if ( trip.id > 0 ){
        body.id = trip.id;
    }
    if (
            (trip.distance !== null)
         && (trip.distance > 0)
       ){
       body.distance = trip.distance;
    }
    if ( 
            (trip.price !== null)
         && (trip.price > 0)
       ){
       body.price = trip.price;
    }
    
    let res = await $jet.api({
        url: '/vehicle_orders',
        method: 'POST',
        body
    });
    
    if (res.success){
        trip.id = res.result.id;
        const adds = {};
        if ( 
                (trip.loaded !==null )
              &&(trip.loaded > 0)
           ){
            adds.loaded = trip.loaded;
        }
        if ( 
                (trip.unloaded !==null )
              &&(trip.unloaded > 0)
           ){
            adds.unloaded = trip.unloaded;
        }
        if (Object.keys(adds).length > 0){
            adds.cargo_count = res.result.cargo_count;
            adds.distance    = res.result.distance;
            adds.price       = res.result.price;
            await $jet.api({
                url: `/vehicle_orders/${ trip.id }`,
                method: 'PUT',
                body: adds
            });
        }
    }
    
    return res;
}   //savetrip

export async function deltrip(trip){
    return $jet.api({
        url: `/vehicle_orders/${ trip.id }/close`,
        method: 'POST',
        body: {
            cargo_count: trip.cargo_count
        },
    });
}