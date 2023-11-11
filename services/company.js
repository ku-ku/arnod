import { phpdate2m } from "app-ext/utils";

export async function gettotals(d1, d2){
    const res = await $jet.api({
        url: '/reports/total',
        key: 'totals',
        params: {
            start_date: $moment(d1).format('YYYY-MM-DD'),
            end_date: $moment(d2).format('YYYY-MM-DD')
        }
    });
    if (res.success){
        return res.result;
    } else {
        throw res.error;
    }
};

/**
 * @param {Date} d1 
 * @param {Date} d2
 * @param {Object} item {type?, id?}
 * @param {Object} opts - add's
 * 
 */
export async function getexpences(d1, d2, item = null, opts = null){
    
    let url = '/expenses';
    switch (item?.type||'all'){
        case 'driver':
            url = `/expenses/by/driver/${item.item.id}`;
            break;
        case 'vehicle':
            url = `/expenses/by/vehicle/${item.item.id}`;
            break;
    }
    
    const params = {
            start_date: $moment(d1).format('YYYY-MM-DD'),
            end_date: $moment(d2).format('YYYY-MM-DD'),
            include: '*',
            page:    opts?.page || 1,
            perPage: opts?.perPage || -1
    };
    if (item?.id){
        url = `/expenses/${ item.id }`;
        params.page = 1;
        params.perPage = 1;
        //no-work params.filters = `id:${item.id}`;
    }
    
    const res = await $jet.api({
        url,
        key: 'expenses',
        params
    });
    
    if (res.success){
        const items = res.result.items || [res.result];
        if (item){
            //as-is
            items.forEach( item => {
                item.name = item.expenses_type.title;
                item.date = phpdate2m(item.date);
                item.cost = Math.floor(item.cost*100)/100;
                item.cost_vat = Math.floor(item.cost_vat*100)/100;
                item.cost_original = Math.floor(item.cost_original*100)/100;
            });
            return items;
        } else {
            return getexpences.grouping(items);
        }
    } else {
        throw res.error;
    }
};

/**
 * grouping by Exp-type
 * @param {Array} items 
 */
getexpences.grouping = function(items){
    let n, exps = [];
    items.forEach( i => {
        n = exps.findIndex( e => e.id === i.expenses_type.id );
        if ( n < 0 ){
            exps.push({
                id: i.expenses_type.id,
                name: i.expenses_type.title,
                cost: Math.floor(i.cost*100)/100,
                cost_vat: Math.floor(i.cost_vat*100)/100,
                cost_original: Math.floor(i.cost_original*100)/100
            });
        } else {
            exps[n].cost += Math.floor(i.cost*100)/100;
            exps[n].cost_vat += Math.floor(i.cost_vat*100)/100;
            exps[n].cost_original += Math.floor(i.cost_original*100/100);
        }
    });
    return exps;
};


export async function getstatuses(d1, d2){
    const res = await $jet.api({
        url: '/reports/by/status',
        params: {
            start_date: $moment(d1).format('YYYY-MM-DD'),
            end_date: $moment(d2).format('YYYY-MM-DD')
        }
    });
    if (res.success){
        return res.result;
    } else {
        throw res.error;
    }
};

export async function getbyvehicles(d1, d2){
    const res = await $jet.api({
        url: '/reports/by/vehicle',
        params: {
            start_date: $moment(d1).format('YYYY-MM-DD'),
            end_date: $moment(d2).format('YYYY-MM-DD')
        }
    });
    if (res.success){
        return res.result;
    } else {
        throw res.error;
    }
};  //getbyvehicles

export async function getbydrivers(d1, d2){
    const res = await $jet.api({
        url: '/reports/by/driver',
        params: {
            start_date: $moment(d1).format('YYYY-MM-DD'),
            end_date: $moment(d2).format('YYYY-MM-DD')
        }
    });
    if (res.success){
        return res.result;
    } else {
        throw res.error;
    }
};  //getbydrivers

export async function getbycontras(d1, d2){
    const res = await $jet.api({
        url: '/reports/by/contractor',
        params: {
            start_date: $moment(d1).format('YYYY-MM-DD'),
            end_date: $moment(d2).format('YYYY-MM-DD')
        }
    });
    if (res.success){
        return res.result;
    } else {
        throw res.error;
    }
};  //getbydrivers

export async function getfuel(d1, d2){
    const res = await $jet.api({
        url: '/reports/fuel_consumption',
        params: {
            start_date: $moment(d1).format('YYYY-MM-DD'),
            end_date: $moment(d2).format('YYYY-MM-DD')
        }
    });
    if (res.success){
        return res.result;
    } else {
        throw res.error;
    }
};  //getfuel

export async function getincoms(d1, d2){
    const res = await $jet.api({
        url: '/reports/incomes',
        params: {
            start_date: $moment(d1).format('YYYY-MM-DD'),
            end_date: $moment(d2).format('YYYY-MM-DD')
        }
    });
    if (res.success){
        return res.result;
    } else {
        throw res.error;
    }
};  //getincoms
