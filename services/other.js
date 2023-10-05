export async function orderstatuses(){
    const res = await $jet.api({
        url: '/refs/vehicle_order_statuses', 
        key: 'order-statuses',
        params: {perPage:-1}
    });
    if (res.success){
        return res.result.items;
    } else {
        throw res.error;
    }
};   //orderstatuses

const _REFS = {
    routes: {
        url: '/refs/move_directions',
        columns: 'id,title,distance'
    },
    paytypes: {
        url: '/refs/orders_payments_type',
        columns: 'id,title'
    },
    vehitypes: {
        url: '/refs/vehicle_type',
        columns: 'id,title'
    },
    vehiloading: {
        url: '/refs/vehicle_loading_type',
        columns: 'id,title'
    },
    vehiunloading: {
        url: '/refs/vehicle_unloading_type',
        columns: 'id,title'
    }
};

export async function refs(q){
    const r = _REFS[q];
    if ( r ) {
        const res = await $jet.api({
            url: r.url,
            params: {
                perPage: -1,
                columns: r.columns
            }
        });
        if (res.success){
            return res.result.items;
        } else {
            throw {message: res.error};
        }
    }
    return null;
};   //refs
