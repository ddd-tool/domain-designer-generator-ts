import {
  DomainDesignAgg,
  DomainDesignCommand,
  DomainDesignEvent,
  DomainDesignInfo,
  DomainDesignInfoRecord,
  DomainDesignInfoType,
  DomainDesignObject,
  isDomainDesignInfo,
} from '@ddd-tool/domain-designer-core'
import { GeneratorPliginHelper } from '../domain/generator-agg'
import { strUtil } from '../common'
import { CodeFile, CodeSnippets, FacadeCommandCodeProvider, JavaContext, JavaGeneratorAddition } from '../domain/define'
import { Ref } from '@vue/reactivity'

export default GeneratorPliginHelper.createHotSwapPlugin(() => {
  function getDomainObjectName(info: DomainDesignObject) {
    return strUtil.stringToUpperCamel(info._attributes.name)
  }
  return {
    unmount({ api }) {
      api.commands.clearCaches()
      api.commands._setCommandCodeProvider(() => [])
      api.commands._setFacadeCommandCodeProvider(() => [])
      api.commands._setAggCodeProvider(() => [])
      api.commands._setEventCodeProvider(() => [])
      api.commands._setReadModelCodeProvider(() => [])
      api.commands._setCodeFileProvider(() => [])
      api.commands.setContext({} as any)
    },
    mount({ api }) {
      const context = api.states.context as Readonly<Ref<JavaContext>>
      function inferType(imports: Set<string>, obj: DomainDesignObject): string {
        const additions = context.value.additions
        const name = strUtil.stringToLowerSnake(obj._attributes.name).replace(/_/, ' ')
        if (/\b(time|timestamp|date|deadline|expire)\b/.test(name)) {
          if (additions.has(JavaGeneratorAddition.Timezone)) {
            imports.add('java.time.OffsetDateTime')
            return 'OffsetDateTime'
          } else {
            imports.add('java.time.LocalDateTime')
            return 'LocalDateTime'
          }
        } else if (/\b(enum|gender|sex|count|flag|times)\b/.test(name)) {
          return 'Integer'
        }
        if (isDomainDesignInfo(obj) && (obj._attributes.type === 'Id' || obj._attributes.type === 'Version')) {
          return 'Long'
        }
        return 'String'
      }

      api.commands._setInfoCodeProvider(
        (info: DomainDesignInfo<DomainDesignInfoType, string>): CodeSnippets<'Info'>[] => {
          const imports = new Set<string>()
          imports.add(context.value.nonNullAnnotation)
          const nonNullAnnotation = context.value.nonNullAnnotation.split('.').pop()
          const className = getDomainObjectName(info)
          const additions = context.value.additions
          const code: string[] = []
          if (additions.has(JavaGeneratorAddition.RecordVakueObject)) {
            // 高版本jdk的record类型
            code.push(`public record ${className} (@${nonNullAnnotation} ${inferType(imports, info)} value) {`)
            code.push(`    public ${className} {`)
            code.push(`        // HACK check value`)
            code.push(`    }`)
            code.push(`}`)
          } else if (additions.has(JavaGeneratorAddition.Lombok)) {
            // Lombok + class类型
            code.push(`@lombok.AllArgsConstructor`)
            code.push(`@lombok.Getter`)
            code.push(`public class ${className} {`)
            code.push(`    private final ${inferType(imports, info)} value;`)
            code.push(``)
            code.push(`    public ${className} (@${nonNullAnnotation} ${inferType(imports, info)} value) {`)
            code.push(`        // HACK check value`)
            code.push(`        this.value = value;`)
            code.push(`    }`)
            code.push(`}`)
          } else {
            // 普通class类型
            code.push(`public class ${getDomainObjectName(info)} {`)
            code.push(`    private final ${inferType(imports, info)} value;`)
            code.push(``)
            code.push(`    public ${className} (@${nonNullAnnotation} ${inferType(imports, info)} value) {`)
            code.push(`        // HACK check value`)
            code.push(`        this.value = value;`)
            code.push(`    }`)
            code.push(``)
            code.push(`    public ${inferType(imports, info)} getValue() {`)
            code.push(`        return this.value;`)
            code.push(`    }`)
            code.push(`}`)
          }
          return [
            {
              type: 'Info',
              imports,
              content: code.join('\n'),
            },
          ]
        }
      )

      function commandCodeProvider(
        cmd: DomainDesignCommand<DomainDesignInfoRecord>
      ): CodeSnippets<'Command' | 'CommandHandler'>[] {
        const additions = context.value.additions

        const imports = new Set<string>()
        imports.add(context.value.nonNullAnnotation)
        const nonNullAnnotation = context.value.nonNullAnnotation.split('.').pop()
        const className = getDomainObjectName(cmd)
        const code: string[] = []
        const infos = Object.values(cmd.inner)
        if (additions.has(JavaGeneratorAddition.RecordVakueObject)) {
          if (additions.has(JavaGeneratorAddition.LombokBuilder)) {
            code.push(`@lombok.Builder(toBuilder = true)`)
          }
          code.push(`public record ${className} {`)
          const infoCode: string[] = []
          for (const info of infos) {
            const infoName = getDomainObjectName(info)
            infoCode.push(`        @${nonNullAnnotation}\n        ${infoName} ${strUtil.lowerFirst(infoName)}`)
          }
          code.push(infoCode.join(',\n'))
          code.push(`) {`)
          code.push(`    public ${className} {`)
          code.push(`        // HACK check value`)
          code.push(`    }`)
          code.push(`}`)
        } else if (additions.has(JavaGeneratorAddition.Lombok)) {
          code.push(`@lombok.AllArgsConstructor`)
          code.push(`@lombok.Getter`)
          if (additions.has(JavaGeneratorAddition.LombokBuilder)) {
            code.push(`@lombok.Builder(toBuilder = true)`)
          }
          code.push(`publish class ${className} {`)
          for (const info of infos) {
            const infoName = getDomainObjectName(info)
            code.push(`    @${nonNullAnnotation}`)
            code.push(`    private final ${infoName} ${strUtil.upperFirst(infoName)};`)
          }
          code.push(``)
          const infoCode: string[] = []
          for (const info of infos) {
            const infoName = getDomainObjectName(info)
            infoCode.push(`@${nonNullAnnotation} ${inferType(imports, info)} ${strUtil.lowerFirst(infoName)}`)
          }
          code.push(`    public ${className}(${infoCode.join(', ')}) {`)
          code.push(`        // HACK check value`)
          code.push(`    }`)
          code.push(`}`)
        } else {
          code.push(`publish class ${className} {`)
          for (const info of infos) {
            const infoName = getDomainObjectName(info)
            code.push(`    @${nonNullAnnotation}`)
            code.push(`    private final ${inferType(imports, info)} ${strUtil.upperFirst(infoName)};`)
          }
          code.push(``)
          const infoCode: string[] = []
          for (const info of infos) {
            const infoName = getDomainObjectName(info)
            infoCode.push(`@${nonNullAnnotation} ${inferType(imports, info)} ${strUtil.lowerFirst(infoName)}`)
          }
          code.push(`    public ${className}(${infoCode.join(', ')}) {`)
          code.push(`        // HACK check value`)
          code.push(`    }`)
          for (const info of infos) {
            const infoName = getDomainObjectName(info)
            code.push(``)
            code.push(`    public ${inferType(imports, info)} get${infoName} () {`)
            code.push(`        return this.${strUtil.lowerFirst(infoName)};`)
            code.push(`    }`)
          }
          code.push(`}`)
        }
        return [
          {
            type: 'Command',
            imports,
            content: code.join('\n'),
          },
        ]
      }
      api.commands._setCommandCodeProvider(commandCodeProvider)
      api.commands._setFacadeCommandCodeProvider(commandCodeProvider as unknown as FacadeCommandCodeProvider)

      api.commands._setAggCodeProvider((agg: DomainDesignAgg<DomainDesignInfoRecord>): CodeSnippets<'Agg'>[] => {
        const imports = new Set<string>()
        imports.add(context.value.nonNullAnnotation)
        const nonNullAnnotation = context.value.nonNullAnnotation.split('.').pop()
        const additions = context.value.additions
        const designer = api.states.designer.value

        const className = getDomainObjectName(agg)
        const code: string[] = []
        const infos = Object.values(agg.inner)
        if (additions.has(JavaGeneratorAddition.Lombok)) {
          code.push(`@lombok.AllArgsConstructor`)
          code.push(`@lombok.Getter`)
          code.push(`public class ${className} {`)
          for (const info of infos) {
            const infoName = getDomainObjectName(info)
            imports.add(`${context.value.namespace}.${context.value.moduleName}.${infoName}`)
            code.push(`    @${nonNullAnnotation}`)
            code.push(`    private ${infoName} ${strUtil.lowerFirst(infoName)};`)
          }
          const commands = [...designer._getContext().getAssociationMap()[agg._attributes.__id]].filter((item) => {
            return item._attributes.rule === 'Command' || item._attributes.rule === 'FacadeCommand'
          })
          for (const command of commands) {
            const commandName = getDomainObjectName(command)
            code.push(``)
            code.push(`    public void handle${commandName}(${commandName} ${strUtil.lowerFirst(commandName)}) {`)
            code.push(`        // HACK need implement`)
            code.push(`    }`)
          }
          code.push(`}`)
        } else {
          code.push(`public class ${className} {`)
          for (const info of infos) {
            const infoName = getDomainObjectName(info)
            code.push(`    @${nonNullAnnotation}`)
            code.push(`    private ${infoName} ${strUtil.lowerFirst(infoName)};`)
          }
          for (const info of infos) {
            const infoName = getDomainObjectName(info)
            code.push(``)
            code.push(`    @${nonNullAnnotation}`)
            code.push(`    public ${infoName} get${infoName}() {`)
            code.push(`        return this.${strUtil.lowerFirst(infoName)};`)
            code.push(`    }`)
          }
          const commands = [...designer._getContext().getAssociationMap()[agg._attributes.__id]].filter(
            (item) => item._attributes.rule === 'Command' || item._attributes.rule === 'FacadeCommand'
          )
          for (const command of commands) {
            const commandName = getDomainObjectName(command)
            code.push(``)
            code.push(`    public void handle${commandName}(${commandName} ${strUtil.lowerFirst(commandName)}) {`)
            code.push(`        // HACK need implement`)
            code.push(`    }`)
          }
          code.push(`}`)
        }
        return [
          {
            type: 'Agg',
            imports,
            content: code.join('\n'),
          },
        ]
      })

      api.commands._setEventCodeProvider(
        (event: DomainDesignEvent<DomainDesignInfoRecord>): CodeSnippets<'Event'>[] => {
          const imports = new Set<string>()
          imports.add(context.value.nonNullAnnotation)
          const nonNullAnnotation = context.value.nonNullAnnotation.split('.').pop()
          const additions = context.value.additions
          const className = getDomainObjectName(event)
          const code: string[] = []
          const infos = Object.values(event.inner)
          if (additions.has(JavaGeneratorAddition.RecordVakueObject)) {
            // 高版本jdk的record类型
            if (additions.has(JavaGeneratorAddition.LombokBuilder)) {
              code.push(`@lombok.Builder(toBuilder = true)`)
            }
            code.push(`publish record ${className} (`)
            const infoCode: string[] = []
            for (const info of infos) {
              const infoName = getDomainObjectName(info)
              infoCode.push(`        @${nonNullAnnotation}\n        ${infoName} ${strUtil.lowerFirst(infoName)}`)
            }
            code.push(infoCode.join(',\n'))
            code.push(`) {`)
            code.push(`    public ${className} {`)
            code.push(`        // HACK check value`)
            code.push(`    }`)
            code.push(`}`)
          } else if (additions.has(JavaGeneratorAddition.Lombok)) {
            code.push(`@lombok.AllArgsConstructor`)
            code.push(`@lombok.Getter`)
            if (additions.has(JavaGeneratorAddition.LombokBuilder)) {
              code.push(`@lombok.Builder(toBuilder = true)`)
            }
            code.push(`publish class ${className} {`)
            for (const info of infos) {
              const infoName = getDomainObjectName(info)
              code.push(`    @${nonNullAnnotation}`)
              code.push(`    private final ${infoName} ${strUtil.lowerFirst(infoName)};`)
            }
            code.push(``)
            const infoCode: string[] = []
            for (const info of infos) {
              const infoName = getDomainObjectName(info)
              infoCode.push(`@${nonNullAnnotation} ${infoName} ${strUtil.lowerFirst(infoName)}`)
            }
            code.push(`    public ${className}(${infoCode.join(', ')}) {`)
            code.push(`        // HACK check value`)
            code.push(`    }`)
            code.push(`}`)
          } else {
            code.push(`publish class ${className} {`)
            for (const info of infos) {
              const infoName = getDomainObjectName(info)
              code.push(`    @${nonNullAnnotation}`)
              code.push(`    private final ${infoName} ${strUtil.lowerFirst(infoName)};`)
            }
            code.push(``)
            const infoCode: string[] = []
            for (const info of infos) {
              const infoName = getDomainObjectName(info)
              infoCode.push(`@${nonNullAnnotation} ${inferType(imports, info)} ${strUtil.lowerFirst(infoName)}`)
            }
            code.push(`    public ${className}(${infoCode.join(', ')}) {`)
            code.push(`        // HACK check value`)
            code.push(`    }`)
            for (const info of infos) {
              const infoName = getDomainObjectName(info)
              code.push(``)
              code.push(`    public ${infoName} get${infoName} () {`)
              code.push(`        return this.${strUtil.lowerFirst(infoName)};`)
              code.push(`    }`)
            }
            code.push(`}`)
          }
          return [
            {
              type: 'Event',
              imports,
              content: code.join('\n'),
            },
          ]
        }
      )

      api.commands._setReadModelCodeProvider(() => [])

      api.commands._setCodeFileProvider(() => {
        const codeFiles: CodeFile[] = []
        const commands = api.states.designer.value._getContext().getCommands()
        for (const command of commands) {
          const codes = api.commands._genCommandCode(command)
          const parentDir = [...context.value.namespace.split(/\./), context.value.moduleName]
          codes.forEach((code) => {
            if (code.type === 'Command') {
              const file: CodeFile = new CodeFile(parentDir, getDomainObjectName(command) + '.java')
              file.appendContentln(`package ${context.value.namespace}.${context.value.moduleName};`)
              file.appendContentln('')
              file.addImports(code.imports)
              for (const imp of code.imports) {
                file.appendContentln(`import ${imp};`)
              }
              file.appendContentln('')
              file.appendContentln(code.content)
              codeFiles.push(file)
            } else if (code.type === 'CommandHandler') {
              const file: CodeFile = new CodeFile(parentDir, getDomainObjectName(command) + 'Handler.java')
              file.appendContentln(`package ${context.value.namespace}.${context.value.moduleName};`)
              file.appendContentln('')
              file.addImports(code.imports)
              for (const imp of code.imports) {
                file.appendContentln(`import ${imp};`)
              }
              file.appendContentln('')
              file.appendContentln(code.content)
              codeFiles.push(file)
            } else {
              isNever(code.type)
            }
          })
        }
        const facadeCommands = api.states.designer.value._getContext().getFacadeCommands()
        for (const facadeCmd of facadeCommands) {
          const codes = api.commands._genFacadeCommandCode(facadeCmd)
          const parentDir = [...context.value.namespace.split(/\./), context.value.moduleName]
          codes.forEach((code) => {
            if (code.type === 'FacadeCommand') {
              const file: CodeFile = new CodeFile(parentDir, getDomainObjectName(facadeCmd) + '.java')
              file.appendContentln(`package ${context.value.namespace}.${context.value.moduleName};`)
              file.appendContentln('')
              file.addImports(code.imports)
              for (const imp of code.imports) {
                file.appendContentln(`import ${imp};`)
              }
              file.appendContentln('')
              file.appendContentln(code.content)
              codeFiles.push(file)
            } else {
              isNever(code.type)
            }
          })
        }
        const aggs = api.states.designer.value._getContext().getAggs()
        for (const agg of aggs) {
          const codes = api.commands._genAggCode(agg)
          const parentDir = [...context.value.namespace.split(/\./), context.value.moduleName]
          codes.forEach((code) => {
            const file: CodeFile = new CodeFile(parentDir, getDomainObjectName(agg) + '.java')
            file.appendContentln(`package ${context.value.namespace}.${context.value.moduleName};`)
            file.appendContentln('')
            file.addImports(code.imports)
            for (const imp of code.imports) {
              file.appendContentln(`import ${imp};`)
            }
            file.appendContentln('')
            file.appendContentln(code.content)
            codeFiles.push(file)
          })
        }
        const events = api.states.designer.value._getContext().getEvents()
        for (const event of events) {
          const codes = api.commands._genEventCode(event)
          const parentDir = [...context.value.namespace.split(/\./), context.value.moduleName]
          codes.forEach((code) => {
            const file: CodeFile = new CodeFile(parentDir, getDomainObjectName(event) + '.java')
            file.appendContentln(`package ${context.value.namespace}.${context.value.moduleName};`)
            file.appendContentln('')
            file.addImports(code.imports)
            for (const imp of code.imports) {
              file.appendContentln(`import ${imp};`)
            }
            file.appendContentln('')
            file.appendContentln(code.content)
            codeFiles.push(file)
          })
        }
        // const readModels = api.states.designer.value._getContext().getReadModels()
        // for (const readModel of readModels) {
        //   const codes = api.commands._genReadModelCode(readModel)
        // }
        return codeFiles
      })
    },
  }
})
