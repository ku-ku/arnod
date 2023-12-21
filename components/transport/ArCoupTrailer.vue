<template>
    <ar-simple-dialog title="Привязать прицеп"
                      icon="mdi-truck-trailer"
                      v-model="show"
                      :width="480"
                      :loading="pending"
                      v-on:save="save">
        <v-row dense>
            <v-col cols="12">
                <jet-input-date v-model="start"
                                type="date"
                                readonly
                                label="Дата" />
            </v-col>
        </v-row>
        <v-row dense>
            <v-col cols="12">
                <v-autocomplete label="Прицеп"
                                v-model="day.trailers"
                                clearable
                                density="compact"
                                hide-details
                                name="trailer"
                                item-title="reg_number"
                                item-value="id"
                                :items="trailers"
                                return-object>
                    <template v-slot:item="{item, props}">
                        <v-list-item v-bind="props" 
                                     :title="item.raw.reg_number"
                                     :subtitle="`${ item.raw.name }, ${item.raw.volume || '-'}`">
                        </v-list-item>
                    </template>
                </v-autocomplete>
            </v-col>
        </v-row>
    </ar-simple-dialog>
</template>
<script>
import { refs } from "~/services/other";
import ArSimpleDialog from "../ArSimpleDialog";
import JetInputDate from "app-ext/components/editors/JetInputDate";

export default {
    name: 'ArCoupTrailer',
    components: {
        ArSimpleDialog,
        JetInputDate
    },
    emits: ['success'],
    async setup(){
        const {data: trailers, pending} = useAsyncData('trailers', async ()=>{
            let res = [];
            try {
                res = await refs('trailers');
            } catch(e){
                console.log('ERR(trailers)', e);
            }
            return res;
        });
        return {
            trailers,
            pending
        }
    },
    data(){
        return {
            show: false,
            day: null
        };
    },
    computed: {
        title(){
            return `Привязать прицеп на ${ (this.day?.day) ? this.day.day.format('DD.MM.YYYY') : '-' }`;
        },
        start(){
            return (this.day?.day) ? this.day.day.toDate() : null;
        }
    },
    methods: {
        open(day){
            this.day = day;
            this.show = true;
        },
        async save(){
            if (!this.day.trailers){
                return false;
            }
            
            this.pending = true;
            
            try {
                let res = await $jet.api({
                    url: `/vehicles/${ this.day.vehicle_id }/attach/trailer`,
                    method: 'POST',
                    body: {
                        force: true,
                        start_date: this.day.day.format('YYYY-MM-DD'),
                        trailer_id: this.day.trailers.id
                    }
                });
                console.log('save', res);
                if (res.success){
                    this.$emit("success", this.day);
                    this.show = false;
                }
            } catch(e){
                console.log('ERR (trailer)', e);
                $jet.msg({
                            text: `Ошибка сохранения данных сцепки.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                            color: 'warning'
                });
            } finally {
                this.pending = false;
            }
        }
    }
}
</script>