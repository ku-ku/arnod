<template>
    <v-list>
        <v-list-item v-if="pending">
            <v-skeleton-loader type="list-item@3" />
        </v-list-item>
        <template v-else-if="statuces.length > 0">
            <v-list-item v-for="s in statuces"
                         :key="'s-' + s.id">
                #{{ s.organization_order?.number }}
            </v-list-item>
        </template>
        <template v-else>
            <v-list-item class="ma-5">
                <v-alert type="info"
                         border="top"
                         elevation="3"
                         icon
                         variant="tonal">
                    На текущий для {{ coup.reg_number }} момент нет информации о назначенных/выполняемых рейсах
                </v-alert>
            </v-list-item>    
        </template>
    </v-list>
</template>
<script setup>
    const props = defineProps({
        coupling: Object
    });
    
    const coup = toRef(props, 'coupling');
    
    const {data: statuces, pending} = useLazyAsyncData('co-statuces', async ()=>{
        try{
            let res = await $jet.api({
                url: '/vehicle_orders',
                params: {
                    include: '*',
                    filters: `vehicle_id:${ coup.value.id },state:IN_EXECUTION`
                }
            });
            console.log('statuces', res);
            if (res.success){
                return res.result.items;
            }
        } catch(e){
            console.log('ERR (statuces)', e);
            $jet.msg({
                        text: `Ошибка получения информации о статусах ТС.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                        color: 'warning'
            });
        }
    }, {
        watch: [coup]
    });
</script>