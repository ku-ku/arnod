<template>
    <v-dialog v-model="show"
              content-class="ar-odometer"
              eager
              scrollable
              persistent
              open-delay="0"
              :retain-focus="false"
              min-height="320"
              max-width="480">
        <v-toolbar color="primary"
                   density="compact">
            <v-toolbar-title>
                пробег: {{ title }}
            </v-toolbar-title>
            <v-spacer />
            <v-btn size="small"
                   icon="mdi-close"
                   v-on:click="show = false"></v-btn>
        </v-toolbar>
        <v-form v-on:submit.stop.prevent="save"
                ref="form">
            <v-card flat
                    rounded="0">
                <v-card-text>
                    <jet-input-date v-model="dt"
                                    type="date"
                                    name="updated"
                                    required
                                    label="на дату" />
                    <jet-input-number v-model="n"
                                      name="distance"
                                      type="integer"
                                      required
                                      label="пробег"
                                      :messages="current" />
                    <v-alert v-if="error"
                             type="warning" 
                             class="mt-3"
                             bordered>
                        {{ error.message }}
                    </v-alert>
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
                           :loading="loading"
                           append-icon="mdi-send">
                        сохранить
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-form>    
    </v-dialog>
</template>
<script>
import JetInputDate from "app-ext/components/editors/JetInputDate";
import JetInputNumber from "app-ext/components/editors/JetInputNumber";
import { profile } from "app-ext/composables/profile";
import { all } from "~/composables/data";

export default{
    name: 'ArOdometer',
    emits: ['update'],
    components: {
        JetInputDate,
        JetInputNumber
    },
    data(){
        return {
            show: false,
            loading: false,
            dt: null,
            n: null,
            error: null
        };
    },
    computed: {
        vehicle(){
            return all.vehicle;
        },
        title(){
            return this.vehicle?.reg_number;
        },
        prev(){
            if (this.vehicle?.odometers?.length > 0){
                const res = this.vehicle.odometers[0];
                res.updated  = $moment(res.updated_at, 'YYYY-MM-DD').format('DD.MM.YYYY');
                return res;
            }
            return {
                updated: null,
                distance: -1
            }
        },
        current(){
            if (this.prev.distance > 0){
                return `на ${ this.prev.updated }: ${this.prev.distance} ${this.prev.type}`;
            }
            return 'нет данных о пробеге';
        }
    },
    methods: {
        open(){
            console.log('odo for', this.vehicle);
            this.dt = new Date();
            this.show = true;
            this.error = null;
            setTimeout(()=>{
                $('.ar-odometer input[name="distance"]').focus();
            }, 200);
        },  //open
        async save(){
            this.error = null;
            this.loading = true;
            let res = await this.$refs["form"].validate();
            if (!res){
                console.log('is`t valid', res, this.$refs["form"]);
                return false;
            }
            if (Number(this.n) < this.prev.distance){
                this.error = {message: 'Показание пробега должно быть больше указанного ранее'};
                return false;
            }
            try {
                let body = {
                                distance: this.n, 
                                type: "km", 
                                date: $moment(this.dt).format('YYYY-MM-DD'), 
                                vehicle: {id: this.vehicle.id},
                                user_id: profile.subject.id
                };
                
                res = await $jet.api({
                    url: '/odometers',
                    method: 'POST',
                    body
                });
                if (res.success){
                    refreshNuxtData('vehicle');
                    this.show = false;
                } else {
                    throw {message: res.error};
                }
                console.log('saved', res);
            } catch(e){
                console.log('ERR(odo-save)', e);
                this.error = e;
            } finally {
                this.loading = false;
            }
            return false;
        }   //save
    }       //methods
}
</script>
<style lang="scss" scoped>
    .v-toolbar{
        &-title{
            width: 100%;
            font-size: 1rem;
        }
    }
</style>