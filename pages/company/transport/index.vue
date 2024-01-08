<template>
    <teleport to="#ar-title">
        <div class="d-flex align-center">
            <v-menu>
                <template v-slot:activator="{ props }">
                    <v-btn v-bind="props"
                           variant="tonal"
                           color="primary"
                           :prepend-icon="_NAVS.items[_NAVS.active.value]?.icon"
                           append-icon="mdi-chevron-down"
                           ref="ddbtn">
                        <v-badge inline :content="_NAVS.items[_NAVS.active.value]?.n"
                                 v-bind:class="{empty: !(_NAVS.items[_NAVS.active.value]?.n > 0)}"
                                 color="primary">
                            {{ _NAVS.items[_NAVS.active.value]?.title }}
                        </v-badge>    
                    </v-btn>
                </template>
                <v-list density="compact" nav>
                    <v-list-item v-for="i in _NAVS.items"
                                 :key="'tra-nav-' + i.id"
                                 :prepend-icon="i.icon"
                                 :value="i.id"
                                 v-on:click="_NAVS.set(i.id)">
                        <v-list-item-title class="pa-3">
                            <v-badge :content="i.n"
                                     inline
                                     v-bind:class="{empty: !(i.n > 0)}"
                                     color="grey">
                                {{ i.title }}
                            </v-badge>
                        </v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-menu>
            <app-search-input hide-details
                              v-on:search="by = $event" />
        </div>
    </teleport>
    <template v-if="has('comp')">
        <component :is="_NAVS.items[_NAVS.active.value].comp"
                   :search="by"
                   v-on:count="numof"></component>
    </template>
</template>
<script setup>
    import AppSearchInput from "app-ext/components/AppSearchInput";
    import ArCouplings from "~/components/transport/ArCouplings";
    import ArVehicles from "~/components/transport/ArVehicles";
    import ArTrailers from "~/components/transport/ArTrailers";
    import ArDrivers from "~/components/transport/ArDrivers";
    
    const _NAVS = {
        items: [
            {id: 0, title: "Транспорт",  icon: "mdi-truck-flatbed", comp: ArVehicles, n: 0},
            {id: 1, title: "Прицепы",    icon: "mdi-truck-trailer", comp: ArTrailers, n: 0},
            {id: 2, title: "Сцепки",     icon: "mdi-dump-truck",    comp: ArCouplings, n: 0},
            {id: 3, title: "Водители",   icon: "mdi-account-multiple", comp: ArDrivers, n: 0}
        ],
        active: ref(0),
        set: n => {
                _NAVS.active.value = n;
                useSeoMeta({
                    title: _NAVS.items[n].title
                });
                refreshNuxtData('company-settings');
            }
    };
    //_NAVS.set(0);
    
    /**
     * 
     * @type String - search
     */
    let by = ref(null),
      ddbtn= ref(null);
    
    function has(q){
        switch(q){
            case "comp":
                return _NAVS.items[_NAVS.active.value].comp;
        }
        return false;
    };
    
    function numof(n){
        _NAVS.items[_NAVS.active.value].n = n;
        ddbtn.value?.$forceUpdate();
    };
    
</script>