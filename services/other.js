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
}
