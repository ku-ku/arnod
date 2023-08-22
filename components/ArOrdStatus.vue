<template>
    <div class="new-status">
        <v-menu content-class="new-status__conte">
            <template v-slot:activator="{props}">
                <v-btn block
                       color="green-lighten-5"
                       :disabled="!to"
                       v-bind="props"
                       rounded="2"
                       elevation="0"
                       variant="elevated">
                        <div class="d-flex flex-column py-1">
                            {{ status.title }}
                            <div class="text-muted">
                                {{ status.updated }}
                            </div>
                        </div>
                        <v-icon>mdi-chevron-down</v-icon>
                </v-btn>
            </template>
            <v-list density="compact">
                <v-list-item :title="to?.title"
                             subtitle="изменить статус"
                             v-on:click="change">
                    <template v-slot:append
                              v-if="has('params')">
                        <v-icon>mdi-alert-circle-outline</v-icon>
                    </template>
                </v-list-item>
            </v-list>
        </v-menu>
        <ar-ord-params ref="params" 
                       :status="status" 
                       v-on:values="change2" />
    </div><!--.new-status-->
</template>
<script>
import ArOrdParams from "~/components/ArOrdParams";
import { all } from "~/composables/data";

export default {
    name: 'ArOrdStatus',
    props: {
        status: {
            type: Object
        }
    },
    emits: ['change'],
    components: {
        ArOrdParams
    },
    async setup(){
        const {pending, error, data: statuses} = useAsyncData('order-statuses', all.getstatuses);
        
        return {
            pending, 
            error, 
            statuses
        };
    },
    computed: {
        to(){
            const rules = this.status?.meta?.rules;
            let res = null;
            if (
                    ( rules?.length > 0 )
                 && ( this.statuses?.length > 0)
            ){
                let n = this.statuses.findIndex( s => s.code == rules[0].to );
                res = n > -1 ? this.statuses[n] : null;
            }
            return res;
        }
    },
    methods: {
        has(q){
            switch(q){
                case 'params': 
                    const rules = this.status?.meta?.rules || [];
                    return (rules.length > 0) && (rules[0].data?.length > 0);
            }
            return false;
        },
        change(){
            if ( !this.to ){
                $jet.msg({text: 'Вы не можете изменить этот статус', type: 'warning'});
                return;
            }
            if ( this.has('params') ){
                this.$refs["params"].open();
                return;
            }
            
            $jet.msg({
                text: `Подтветрдите смену статуса на <b>"${this.to.title.toUpperCase()}"</b>`, 
                click: e => {
                    if (!!e){
                        this.$emit('change', this.to);
                    }
                },
                click_title: "Подтвердить", 
                timeout:  300000,
                color: "yellow-lighten-5"
            });
        },
        change2(params){
            const to = {...this.to};
            to.data = params;
            this.$emit('change', to);
        }
    }
}    
</script>
<style lang="scss" scoped>
    .v-btn{
        height: auto !important;
        & .v-btn__content{
            line-height: 1.115;
            flex-direction: column;
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
        }
        & .v-icon{
            position: absolute;
            right: 0.5rem;
            margin-left: 1rem;
        }
    }
    .new-status{
        &__conte{
            background: white;
        }
    }
</style>