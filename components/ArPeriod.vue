<template>
    <div class="ar-period">
        <v-menu>
            <template v-slot:activator="{props}">
                <v-btn flat 
                       text
                       v-bind="props"
                       variant="tonal"
                       color="primary"
                       append-icon="mdi-chevron-down">
                    {{ title }}
                </v-btn>
            </template>    
            <v-list density="compact"
                    class="ar-periods">
                <v-list-item v-for="(m, n) in MONTHS"
                             :key="'month-' + n"
                             :title="m.name"
                             v-on:click="month = n"
                             color="primary"
                             :active="month == n"
                             :value="n"></v-list-item>
                <v-divider />
                <v-list-item :value="-1"
                             v-on:click="show = true">
                    произвольный период...
                </v-list-item>
            </v-list>
        </v-menu>
        <v-dialog v-model="show"
                  scrollable
                  persistent
                  open-delay="0"
                  :retain-focus="false"
                  min-height="320"
                  max-width="480">
            <v-toolbar color="primary"
                       density="compact">
                <v-toolbar-title>период</v-toolbar-title>
                <v-spacer />
                <v-btn size="small"
                       icon="mdi-close"
                       v-on:click="show = false"></v-btn>
            </v-toolbar>
            <v-card flat
                    rounded="0">
                <v-card-text>
                    <jet-input-date v-model="period.start"
                                    type="date"
                                    required
                                    label="начало" />
                    <jet-input-date v-model="period.end"
                                    required
                                    type="date"
                                    label="окончание" />
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn size="small"
                           variant="elevated"
                           prepend-icon="mdi-close"
                           v-on:click="show = false">
                        закрыть
                    </v-btn>
                    <v-btn size="small"
                           variant="elevated"
                           color="primary"
                           append-icon="mdi-send"
                           v-on:click="setperiod">
                        сохранить
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>
<script>
import { MONTHS } from "app-ext/utils";
import JetInputDate from "app-ext/components/editors/JetInputDate";

const now = new Date();

export default {
    name: 'ArPeriod',
    emits: ['period'],
    components: {
        JetInputDate
    },
    setup(props, { emit }){
        const period = ref({
            free: false,
            month: now.getMonth(),
            start: $moment([now.getFullYear(), now.getMonth(), 1]).toDate(),
            end: null
        });
        period.value.end = $moment(period.value.start).add(1, 'month').add(-1, 'days').toDate();
        emit('period', period.value);
        
        return {
            MONTHS,
            period
        };
    },
    data(){
        return {
            show: false
        };
    },
    computed: {
        title(){
            if (this.period.free){
                return `${ $moment(this.period.start).format("DD.MM") } - ${ $moment(this.period.end).format("DD.MM") }`;
            }
            return MONTHS[this.period.month].name;
        },
        month: {
            get(){
                return this.period.month;
            },
            set(val){
                this.period.month = val;
                this.period.free = false;
                this.period.start = new Date(now.getFullYear(), val, 1);
                this.period.end = $moment(this.period.start).add(1, 'month').add(-1, 'days').toDate();
                this.$emit('period', this.period);
            }
        }
    },
    methods: {
        setperiod(){
            this.period.free = true;
            this.period.month = this.period.start.getMonth();
            this.show = false;
            this.$emit('period', this.period);
        }
    }
}
</script>
<style lang="scss" scoped>
    .ar-periods {
        &.v-list {
            &-item {
                font-size: 0.9rem;
            }
        }
    }
</style>
