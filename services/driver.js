export async function getvehicle(){
    const res = await $jet.api({
        url: '/vehicles/by/driver'
    });
    if (res.success){
        //normalize result
        const vc = res.result;
        /*max LoadCapacity*/
        vc.trailer = (vc.trailers?.length > 0) ? vc.trailers[0] : null;
        if (vc.trailer){
            let capacity = vc.trailer.pivot?.vehicle_load_capacity;
            vc.maxCapacity = (capacity) ? (capacity.weight - (vc.weight ?? 0) - (vc.trailer.weight ?? 0)) / 1000 : null;
        }
        return vc;
    } else {
        throw res.error;
    }
};  //getvehicle

export async function getorders(){
    const DT_FORMAT = "YYYY-MM-DD HH:mm:ss";
    
    const res = await $jet.api({url: '/mobile/driver/orders?perPage=-1&filters=state:IN_EXECUTION&orders=-updated_at'});
    
    if (res.success){
        res.result.items.forEach( item => {
            item.start = $moment(item.start_date, DT_FORMAT).format("DD.MM");
            item.end =   $moment(item.end_date, DT_FORMAT).format("DD.MM");
            if ( item.status?.length > 0 ){
                item.status.forEach( s => {
                    s.updated = $moment(s.updated_at, DT_FORMAT).format("DD.MM.YYYY");
                });
            }
            if (item.last_status){
                item.last_status.updated = $moment(item.last_status.updated_at, DT_FORMAT).format("DD.MM.YYYY");
            }
        });
        return res.result.items;
    } else {
        throw res.error;
    }
};  //getorders

export async function getincome(_period = null){
    let period = _period || {};
    
    if ( !period.start ){
        period.start = new Date();
        period.start.setDate(1);
        period.end = $moment(period.start).add(1, "months").add(-1, "days").toDate();
    }
    
    const res = await $jet.api({
        url: '/mobile/driver/income',
        params: {
            start_date: $moment(period.start).format("YYYY-MM-DD"),
            end_date: $moment(period.end).format("YYYY-MM-DD")
        }
    });
  
   
    if (res.success){
        return res.result;
    } else {
        throw res.error;
    }
}   //getincome