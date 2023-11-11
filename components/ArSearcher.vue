<template>
    <v-menu v-model="menu"
            :offset="[-12, 0]">
        <template v-slot:activator="{ props }">
            <app-search-input v-on:search="s = $event" 
                              :pending="pending"
                              label="поиск (фио/грз)" 
                              icon="mdi-chevron-down"
                              v-bind="props" />
        </template>
        <v-list density="compact" nav>
            <v-list-item title="весь список" 
                         prepend-icon="mdi-file-table-outline" 
                         v-on:click="$emit('select', {type: 'all'})" />
            <v-list-item title="сгруппировать по статьям" 
                         prepend-icon="mdi-file-table-box-multiple-outline" 
                         v-on:click="$emit('select', {type: 'group'})" />
            <template v-if="drivers.length > 0">
                <v-divider />
                <v-list-item v-for="d in drivers"
                             :key="'drv-' + d.id"
                             :title="d.user.full_name"
                             prepend-icon="mdi-account-cowboy-hat-outline"
                             v-on:click="$emit('select', {type: 'driver', item: d})">
                </v-list-item>
            </template>
            <template v-if="vehicles.length > 0">
                <v-divider />
                <v-list-item v-for="v in vehicles"
                             :key="'vc-' + v.id"
                             :title="v.reg_number"
                             prepend-icon="mdi-truck-outline"
                             v-on:click="$emit('select', {type: 'vehicle', item: v})">
                </v-list-item>
            </template>
        </v-list>
    </v-menu>
</template>
<script setup>
    import {ref, computed, watch, defineEmits} from "vue";
    import AppSearchInput from "app-ext/components/AppSearchInput";
    import { empty } from "app-ext/utils";
    import { refs } from "~/services/other";
    
    const menu = ref(false),
          s = ref(null),
          _drivers = ref([]),
          _vehicles= ref([]);
  
    const emit = defineEmits(['select']);
  
    const { pending } = useAsyncData('references', async ()=>{
        try {
            if (_drivers.value.length < 1){
                _drivers.value = await refs('drivers');
            }
            if (_vehicles.value.length < 1){
                _vehicles.value = await refs('vehicles');
            }
        } catch(e){
            console.log('ERR (refs)', e);
        }
    }); //references
    
    const drivers = computed(()=>{
        if ( empty(s.value) ){
            return [];
        }
        const re = new RegExp(`^(${ s.value })+`, 'i');
        return _drivers.value.filter( d => {
            return re.test(d.user.full_name);
        });
    });
    const vehicles = computed(()=>{
        if ( empty(s.value) ){
            return [];
        }
        const re = new RegExp(`(${ s.value })+`, 'i');
        return _vehicles.value.filter( v => {
            return re.test(v.reg_number);
        });
    });
    
    watch(s, ()=>{
        if ( 1===vehicles.value.length ){
            emit('select', {type: 'vehicle', item: vehicles.value[0]});
        } else if ( 1===drivers.value.length ){
            emit('select', {type: 'driver', item: drivers.value[0]});
        }
        if (
                (vehicles.value.length>1)
             || (drivers.value.length>1)
        ){
            menu.value = true;
        }
    });
    
</script>