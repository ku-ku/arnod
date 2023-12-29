<template>
    <v-dialog v-model="show"
              :width="width">
        <v-toolbar color="primary"
                   density="compact">
            <v-toolbar-title>
                <v-icon size="small">{{ icon }}</v-icon>&nbsp;
                {{ title }}
            </v-toolbar-title>
            <v-spacer />
            <v-btn icon="mdi-close"
                   flat
                   v-on:click="show = false">
            </v-btn>
        </v-toolbar>
        <v-card rounded="0"
                :loading="loading">
            <v-card-text class="pb-5">
                <slot />
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
                       v-on:click="$emit('save')">
                    сохранить
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
export default {
    name: 'ArSimpleDlg',
    props: {
        icon: {
            type: String,
            required: false,
            default: 'mdi-square-edit-outline'
        },
        title: {
            type: String,
            required: true
        },
        loading: {
            type: Boolean,
            required: false,
            default: false
        },
        width: {
            type: Number,
            required: false,
            default: 640
        },
        modelValue: {
            type: Boolean
        }
    },
    emits: ['update:modelValue', 'save'],
    computed: {
        show: {
            get(){
                return this.modelValue;
            },
            set(val){
                this.$emit('update:modelValue', val);
            }
        }
    }
}    
</script>