<template>
    <v-dialog v-model="show"
              content-class="ar-params"
              eager
              scrollable
              persistent
              open-delay="0"
              :retain-focus="false"
              max-width="480">
        <v-toolbar color="primary"
                   density="compact">
            <v-toolbar-title>
                {{ title }}
            </v-toolbar-title>
            <v-spacer />
            <v-btn size="small"
                   icon="mdi-close"
                   v-on:click="show = false"></v-btn>
        </v-toolbar>
        <v-form v-if="has('params')"
                v-on:submit.stop.prevent="send">
            <v-card>
                <v-card-text>
                    <template v-for="d in rules[0].data">
                        <component :is="get('editor', d)"
                                   :label="d.label"
                                   :name="d.name"
                                   :type="d.type"
                                   required
                                   v-model="values[d.name]">
                        </component>
                    </template>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn size="small"
                           variant="elevated"
                           prepend-icon="mdi-close"
                           v-on:click="show = false">
                        закрыть
                    </v-btn>
                    <v-btn type="submit"
                           size="small"
                           variant="elevated"
                           color="primary"
                           append-icon="mdi-send">
                        сохранить
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-form>
    </v-dialog>
</template>
<script>
import JetInputNumber from "app-ext/components/editors/JetInputNumber";
import JetInputString from "app-ext/components/editors/JetInputString";

export default {
    props: {
        /**current order-status*/
        status: {
            type: Object
        }
    },
    name: 'ArOrdParams',
    components: {
        JetInputNumber
    },
    async setup(props){
        const { data: statuses } = useNuxtData('order-statuses');
        /**
         * current status for changing
         */
        const status = toRef(props, 'status');
        const rules = status.value?.meta?.rules || [{data:[]}];
        
        let _values = {};
        rules[0]?.data?.forEach( d => {
            _values[d.name] = null;
        });
        
        const values = ref(_values);
        
        return {
            rules,
            statuses,
            values
        };
    },
    data(){
        return {
            show: false
        };
    },
    computed: {
        /**
         * status to be changed
         */
        to(){
            let res = null;
            if (
                    ( this.rules?.length > 0 )
                 && ( this.statuses?.length > 0)
            ){
                let n = this.statuses.findIndex( s => s.code == this.rules[0].to );
                res = n > -1 ? this.statuses[n] : null;
            }
            return res;
        },
        title(){
            return this.to?.title || '';
        }
    },
    methods: {
        has(q){
            switch(q){
                case 'params': 
                    return (this.rules?.length > 0) && (this.rules[0].data?.length > 0);
                case 'status':
                    return !!this.status;
                case 'to':
                    return !!this.to;
            }
            return false;
        },  //has
        get(q, val){
            switch (q){
                case 'editor':
                    switch (val.type){
                        case "int":
                        case "integer":
                        case "currency":
                        case "float":
                        case "number":
                            return JetInputNumber;
                        default:
                            return JetInputString;
                    }
                    
            }
        },
        open(){
            this.show = true;
            this.$nextTick(()=>{
                $(".ar-params").find("input").focus();
            });
        },
        send(){
            this.$emit("values", this.values);
            this.show = false;
            return false;
        }
    }       //methods
}    
</script>
<style lang="scss">
    .ar-params{
        background: #fff;
        & .v-toolbar{
            &-title{
                width: 100%;
                font-size: 1rem;
            }
        }
    }
</style>