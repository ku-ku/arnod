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
    contractors: {
        url: '/contractors',
        columns: 'id,title'
    },
    routes: {
        url: '/refs/move_directions',
        columns: 'id,title,distance'
    },
    cargo_names: {
        url: '/refs/cargo_names',
        columns: 'id,title'
    },
    cargo_types: {
        url: '/refs/cargo_type',
        columns: 'id,title'
    },
    cargo_units: {
        url: '/refs/cargo_unit',
        columns: 'id,title'
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
    },
    method_of_loading: {
        url: '/refs/method_of_loading',
        columns: 'id,title'
    },
    loading_points: {
        url: '/loading_points',
        columns: 'id,title,lat,lon',
        orders:  'title'
    },
    unloading_points: {
        url: '/unloading_points',
        columns: 'id,title,lat,lon',
        orders:  'title'
    },
    legals: {
        url: '/refs/legal_entity',
        columns: '*'
    },
    drivers: {
        url: '/drivers',
        columns: '*'
    },
    vehicles: {
        url: '/vehicles',
        columns: 'id,reg_number,legal_entity_id'
    },
    exp_types: {
        url: '/expenses_types',
        columns: '*'
    },
    vat_rates: {
        url: '/refs/vat_rates',
        columns: '*'
    },
    roles: {
        url: '/rbac/roles',
        columns: 'id,title'
    },
    carriers: {
        url: '/carriers',
        columns: 'id,title'
    },
    trailers: {
        url: '/trailers',
        columns: '*'
    }
};

export async function refs(q, params = null){
    const r = _REFS[q];
    if ( r ) {
        var params = Object.assign({perPage: -1, columns: r.columns}, params || {});
        const res = await $jet.api({
            url: r.url,
            key: q,
            params
        });
        if (res.success){
            return res.result.items;
        } else {
            throw {message: res.error};
        }
    }
    return null;
};   //refs
