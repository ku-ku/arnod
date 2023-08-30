export async function gettotals(d1, d2){
    const res = await $jet.api({
        url: '/reports/total',
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

export async function getexpences(d1, d2){
    const res = await $jet.api({
        url: '/expenses',
        params: {
            start_date: $moment(d1).format('YYYY-MM-DD'),
            end_date: $moment(d2).format('YYYY-MM-DD'),
            include: '*',
            perPage: 1000000
        }
    });
    if (res.success){
        let n, exps = [];
        res.result.items.forEach( i => {
            n = exps.findIndex( e => e.id === i.expenses_type.id );
            if ( n < 0 ){
                exps.push({
                    id: i.expenses_type.id,
                    name: i.expenses_type.title,
                    cost: Number(i.cost_original)
                });
            } else {
                exps[n].cost += Number(i.cost_original);
            }
        });
        return exps;
    } else {
        throw res.error;
    }
}


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
