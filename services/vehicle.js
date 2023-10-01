export async function getexpences(id, d1, d2){
    const res = await $jet.api({
        url: `/expenses/by/vehicle/${ id }`,
        params: {
            include: '*',
            start_date: $moment(d1).format('YYYY-MM-DD'),
            end_date: $moment(d2).format('YYYY-MM-DD')
        }
    });
    if (res.success){
        let all = 0;
        res.result.items.forEach( item => {
            all += Number(item.cost_original);
            item.date = $moment(item.date, 'YYYY-MM-DD').format("DD.MM.YYYY");
            item.exp_type = item.expenses_type.title;
            item.contra   = item.legal_entity?.title || '';
            item.cost_original = Number(item.cost_original).toFixed(2);
        });
        res.result.items.push({
            id: 9999999,
            date: $moment(d2).format('DD.MM.YYYY'),
            exp_type: 'ИТОГО',
            cost_original: Number(all).toFixed(2)
        });
        return res.result.items;
    } else {
        throw res.error;
    }
};

export async function forscheduling(dt){
    var dt = $moment(dt);
    const res = await $jet.api({
        url: `/vehicles/schedule`,
        params: {
            perPage: 1000,
            columns: 'id,reg_number',
            is_active:true,
            start_date: dt.format('YYYY-MM-DD'),
            end_date: dt.add('days', 1).format('YYYY-MM-DD')
        }
    });
    if (res.success){
        return res.result;
    } else {
        throw res.error;
    }
}   //forscheduling
