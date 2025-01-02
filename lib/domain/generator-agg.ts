import { createPluginHelperByAgg, createSingletonAgg } from 'vue-fn/domain'
import { CodeFile, GeneratorTemplate, Language } from './define'
import { ref } from 'vue'

const agg = createSingletonAgg(() => {
  const javaGeneratorTemplate = ref<GeneratorTemplate<Language> | undefined>(undefined)
  const kotlinGeneratorTemplate = ref<GeneratorTemplate<Language> | undefined>(undefined)
  const goGeneratorTemplate = ref<GeneratorTemplate<Language> | undefined>(undefined)
  const cSharpGeneratorTemplate = ref<GeneratorTemplate<Language> | undefined>(undefined)
  return {
    commands: {
      genCodeFiles(language: Language): CodeFile[] {
        let result: CodeFile[] | undefined = undefined
        if (language === 'java') {
          result = javaGeneratorTemplate.value?.generate()
        } else if (language === 'kotlin') {
          result = kotlinGeneratorTemplate.value?.generate()
        } else if (language === 'go') {
          result = goGeneratorTemplate.value?.generate()
        } else if (language === 'csharp') {
          result = cSharpGeneratorTemplate.value?.generate()
        } else {
          isNever(language)
        }
        if (result === undefined) {
          throw new Error(`no generator for ${language}`)
        }
        return result
      },
      setGeneratorTemplate<LANG extends Language>(language: LANG, template: GeneratorTemplate<LANG>) {
        if (language === 'java') {
          javaGeneratorTemplate.value = template
        } else if (language === 'kotlin') {
          kotlinGeneratorTemplate.value = template
        } else if (language === 'go') {
          goGeneratorTemplate.value = template
        } else if (language === 'csharp') {
          cSharpGeneratorTemplate.value = template
        } else {
          isNever(language)
        }
      },
    },
  }
})

export const GeneratorPliginHelper = createPluginHelperByAgg(agg)

export function useGeneratorAgg() {
  return agg.api
}
