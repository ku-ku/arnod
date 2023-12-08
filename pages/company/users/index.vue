<template>
    <teleport v-if="isMounted" to="#ar-title">
        <div class="d-flex align-center">
            <v-menu>
                <template v-slot:activator="{ props }">
                    <v-btn v-bind="props"
                           variant="tonal"
                           color="primary"
                           append-icon="mdi-chevron-down">
                        {{ _NAVS.items[_NAVS.active]?.title }}
                    </v-btn>
                </template>
                <v-list density="compact" nav>
                    <v-list-item v-for="i in _NAVS.items"
                                 :key="'usr-nav-' + i.id"
                                 :title="i.title"
                                 :prepend-icon="i.icon"
                                 :value="i.id"
                                 v-on:click="_NAVS.set(i.id)">
                    </v-list-item>
                </v-list>
            </v-menu>
            <app-search-input v-on:search="s = $event" 
                              :hide-details="true" />
        </div>
    </teleport>
    <component :is="active_component"
               :search="s"></component>
</template>
<script setup>
    import { ref, computed, onMounted, watch, markRaw } from "vue";
    import ArCarriers from "~/components/users/ArCarriers";
    import ArUsers from "~/components/users/ArUsers";
    import ArRequests from "~/components/users/ArRequests";
    import AppSearchInput from "app-ext/components/AppSearchInput";
    
    let active_component = ref(null),
        s = ref(null);
    
    const _NAVS = {
        items: [
            {id: 0, title: "Перевозчики", icon: "mdi-account-cowboy-hat-outline", comp: ArCarriers},
            {id: 1, title: "Пользователи", icon: "mdi-account-multiple-outline",  comp: ArUsers},
            {id: 2, title: "Заявки на регистрацию", icon: "mdi-account-multiple-plus-outline", comp: ArRequests}
        ],
        active: 0,
        set: n => {
                _NAVS.active = n;
                active_component.value = markRaw(_NAVS.items[n].comp);
            }
    };
    _NAVS.set(0);
    
    const isMounted = ref(false);
    
    onMounted(()=>{
        isMounted.value = true;
    });
    
</script>