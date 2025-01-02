import {
  DomainDesignAgg,
  DomainDesignCommand,
  DomainDesigner,
  DomainDesignEvent,
  DomainDesignFacadeCommand,
  DomainDesignInfo,
  DomainDesignInfoRecord,
  DomainDesignInfoType,
  DomainDesignObject,
  DomainDesignReadModel,
  isDomainDesignInfo,
} from '@ddd-tool/domain-designer-core'
import { CodeFile, CodeSnippets, GeneratorTemplate, JavaGeneratorAddition, Language } from './domain/define'
import { strUtil } from './common'

export class JavaGeneratorTemplate extends GeneratorTemplate<Language.Java> {
  private readonly nonNullAnnotation: string
  private readonly nullableAnnotation: string

  constructor(init: {
    designer: DomainDesigner
    namespace: string
    moduleName: string
    additions: JavaGeneratorAddition[]
    nonNullAnnotation: string
    nullableAnnotation: string
  }) {
    super({
      ...init,
    })
    this.nonNullAnnotation = init.nonNullAnnotation
    this.nullableAnnotation = init.nullableAnnotation
  }

  override inferType(imports: Set<string>, obj: DomainDesignObject): string {
    const name = strUtil.stringToLowerSnake(obj._attributes.name).replace(/_/, ' ')
    if (/\b(time|timestamp|date|deadline|expire)\b/.test(name)) {
      if (this.additions.has(JavaGeneratorAddition.Timezone)) {
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
  override getFileName(object: DomainDesignObject): string {
    return (
      this.namespace.replace(/./g, '/').replace(/-/g, '_') +
      '/' +
      this.moduleName.replace(/-/g, '_') +
      '/' +
      this.getDomainObjectName(object) +
      '.java'
    )
  }
  override getCommandCode(cmd: DomainDesignCommand<DomainDesignInfoRecord>): CodeSnippets {
    const imports = new Set<string>()
    const className = this.getDomainObjectName(cmd)
    const code: string[] = []
    const infos = Object.values(cmd.inner)
    if (this.additions.has(JavaGeneratorAddition.RecordVakueObject)) {
      if (this.additions.has(JavaGeneratorAddition.LombokBuilder)) {
        code.push(`@lombok.Builder(toBuilder = true)`)
      }
      code.push(`public record ${className} {`)
      const infoCode: string[] = []
      for (const info of infos) {
        const infoName = this.getDomainObjectName(info)
        infoCode.push(`        @${this.nonNullAnnotation}\n        ${infoName} ${strUtil.lowerFirst(infoName)}`)
      }
      code.push(infoCode.join(',\n'))
      code.push(`) {`)
      code.push(`    public ${className} {`)
      code.push(`        // HACK check value`)
      code.push(`    }`)
      code.push(`}`)
    } else if (this.additions.has(JavaGeneratorAddition.Lombok)) {
      code.push(`@lombok.AllArgsConstructor`)
      code.push(`@lombok.Getter`)
      if (this.additions.has(JavaGeneratorAddition.LombokBuilder)) {
        code.push(`@lombok.Builder(toBuilder = true)`)
      }
      code.push(`publish class ${className} {`)
      for (const info of infos) {
        const infoName = this.getDomainObjectName(info)
        code.push(`    @${this.nonNullAnnotation}`)
        code.push(`    private final ${infoName} ${strUtil.upperFirst(infoName)};`)
      }
      code.push(``)
      const infoCode: string[] = []
      for (const info of infos) {
        const infoName = this.getDomainObjectName(info)
        infoCode.push(`@${this.nonNullAnnotation} ${this.inferType(imports, info)} ${strUtil.lowerFirst(infoName)}`)
      }
      code.push(`    public ${className}(${infoCode.join(', ')}) {`)
      code.push(`        // HACK check value`)
      code.push(`    }`)
      code.push(`}`)
    } else {
      code.push(`publish class ${className} {`)
      for (const info of infos) {
        const infoName = this.getDomainObjectName(info)
        code.push(`    @${this.nonNullAnnotation}`)
        code.push(`    private final ${this.inferType(imports, info)} ${strUtil.upperFirst(infoName)};`)
      }
      code.push(``)
      const infoCode: string[] = []
      for (const info of infos) {
        const infoName = this.getDomainObjectName(info)
        infoCode.push(`@${this.nonNullAnnotation} ${this.inferType(imports, info)} ${strUtil.lowerFirst(infoName)}`)
      }
      code.push(`    public ${className}(${infoCode.join(', ')}) {`)
      code.push(`        // HACK check value`)
      code.push(`    }`)
      for (const info of infos) {
        const infoName = this.getDomainObjectName(info)
        code.push(``)
        code.push(`    public ${this.inferType(imports, info)} get${infoName} () {`)
        code.push(`        return this.${strUtil.lowerFirst(infoName)};`)
        code.push(`    }`)
      }
      code.push(`}`)
    }
    return {
      imports,
      content: code.join('\n'),
    }
  }
  override getFacadeCommandCode(cmd: DomainDesignFacadeCommand<DomainDesignInfoRecord>): CodeSnippets {
    // TODO
    return this.getCommandCode(cmd as unknown as DomainDesignCommand<DomainDesignInfoRecord>)
  }
  override getAggCode(agg: DomainDesignAgg<DomainDesignInfoRecord>): CodeSnippets {
    const imports = new Set<string>()
    const className = this.getDomainObjectName(agg)
    const code: string[] = []
    const infos = Object.values(agg.inner)
    if (this.additions.has(JavaGeneratorAddition.Lombok)) {
      code.push(`@lombok.AllArgsConstructor`)
      code.push(`@lombok.Getter`)
      code.push(`public class ${className} {`)
      for (const info of infos) {
        const infoName = this.getDomainObjectName(info)
        code.push(`    @${this.nonNullAnnotation}`)
        code.push(`    private ${infoName} ${strUtil.lowerFirst(infoName)};`)
      }
      const commands = [...this.designer._getContext().getAssociationMap()[agg._attributes.__id]].filter(
        (item) => item._attributes.rule === 'Command' || item._attributes.rule === 'FacadeCommand'
      )
      for (const command of commands) {
        const commandName = this.getDomainObjectName(command)
        code.push(``)
        code.push(`public void handle${commandName}(${commandName} ${strUtil.lowerFirst(commandName)}) {`)
        code.push(`    // HACK need implement`)
        code.push(`}`)
      }
      code.push(`public void handle`)
      code.push(`}`)
    } else {
      code.push(`public class ${className} {`)
      for (const info of infos) {
        const infoName = this.getDomainObjectName(info)
        code.push(`    @${this.nonNullAnnotation}`)
        code.push(`    private ${infoName} ${strUtil.lowerFirst(infoName)};`)
      }
      for (const info of infos) {
        const infoName = this.getDomainObjectName(info)
        code.push(``)
        code.push(`    @${this.nonNullAnnotation}`)
        code.push(`    public ${infoName} get${infoName}() {`)
        code.push(`        return this.${strUtil.lowerFirst(infoName)};`)
        code.push(`    }`)
      }
      const commands = [...this.designer._getContext().getAssociationMap()[agg._attributes.__id]].filter(
        (item) => item._attributes.rule === 'Command' || item._attributes.rule === 'FacadeCommand'
      )
      for (const command of commands) {
        const commandName = this.getDomainObjectName(command)
        code.push(``)
        code.push(`public void handle${commandName}(${commandName} ${strUtil.lowerFirst(commandName)}) {`)
        code.push(`    // HACK need implement`)
        code.push(`}`)
      }
      code.push(`public void handle`)
      code.push(`}`)
    }
    return {
      imports,
      content: code.join('\n'),
    }
  }
  override getEventCode(event: DomainDesignEvent<DomainDesignInfoRecord>): CodeSnippets {
    const imports = new Set<string>()
    const className = this.getDomainObjectName(event)
    const code: string[] = []
    const infos = Object.values(event.inner)
    if (this.additions.has(JavaGeneratorAddition.RecordVakueObject)) {
      // 高版本jdk的record类型
      if (this.additions.has(JavaGeneratorAddition.LombokBuilder)) {
        code.push(`@lombok.Builder(toBuilder = true)`)
      }
      code.push(`publish record ${className} (`)
      const infoCode: string[] = []
      for (const info of infos) {
        const infoName = this.getDomainObjectName(info)
        infoCode.push(`        @${this.nonNullAnnotation}\n        ${infoName} ${strUtil.lowerFirst(infoName)}`)
      }
      code.push(infoCode.join(',\n'))
      code.push(`) {`)
      code.push(`    public ${className} {`)
      code.push(`        // HACK check value`)
      code.push(`    }`)
      code.push(`}`)
    } else if (this.additions.has(JavaGeneratorAddition.Lombok)) {
      code.push(`@lombok.AllArgsConstructor`)
      code.push(`@lombok.Getter`)
      if (this.additions.has(JavaGeneratorAddition.LombokBuilder)) {
        code.push(`@lombok.Builder(toBuilder = true)`)
      }
      code.push(`publish class ${className} {`)
      for (const info of infos) {
        const infoName = this.getDomainObjectName(info)
        code.push(`    @${this.nonNullAnnotation}`)
        code.push(`    private final ${infoName} ${strUtil.lowerFirst(infoName)};`)
      }
      code.push(``)
      const infoCode: string[] = []
      for (const info of infos) {
        const infoName = this.getDomainObjectName(info)
        infoCode.push(`@${this.nonNullAnnotation} ${infoName} ${strUtil.lowerFirst(infoName)}`)
      }
      code.push(`    public ${className}(${infoCode.join(', ')}) {`)
      code.push(`        // HACK check value`)
      code.push(`    }`)
      code.push(`}`)
    } else {
      code.push(`publish class ${className} {`)
      for (const info of infos) {
        const infoName = this.getDomainObjectName(info)
        code.push(`    @${this.nonNullAnnotation}`)
        code.push(`    private final ${infoName} ${strUtil.lowerFirst(infoName)};`)
      }
      code.push(``)
      const infoCode: string[] = []
      for (const info of infos) {
        const infoName = this.getDomainObjectName(info)
        infoCode.push(`@${this.nonNullAnnotation} ${this.inferType(imports, info)} ${strUtil.lowerFirst(infoName)}`)
      }
      code.push(`    public ${className}(${infoCode.join(', ')}) {`)
      code.push(`        // HACK check value`)
      code.push(`    }`)
      for (const info of infos) {
        const infoName = this.getDomainObjectName(info)
        code.push(``)
        code.push(`    public ${infoName} get${infoName} () {`)
        code.push(`        return this.${strUtil.lowerFirst(infoName)};`)
        code.push(`    }`)
      }
      code.push(`}`)
    }
    return {
      imports,
      content: code.join('\n'),
    }
  }
  override getInfoCode(info: DomainDesignInfo<DomainDesignInfoType, string>): CodeSnippets {
    const imports = new Set<string>()
    const className = this.getDomainObjectName(info)
    const nonNullName = this.nonNullAnnotation.split('.').pop()
    const code: string[] = []
    if (this.additions.has(JavaGeneratorAddition.RecordVakueObject)) {
      // 高版本jdk的record类型
      code.push(`public record ${className} (@${nonNullName} ${this.inferType(imports, info)} value) {`)
      code.push(`    public ${className} {`)
      code.push(`        // HACK check value`)
      code.push(`    }`)
      code.push(`}`)
    } else if (this.additions.has(JavaGeneratorAddition.Lombok)) {
      // Lombok + class类型
      code.push(`@lombok.AllArgsConstructor`)
      code.push(`@lombok.Getter`)
      code.push(`public class ${className} {`)
      code.push(`    private final ${this.inferType(imports, info)} value;`)
      code.push(``)
      code.push(`    public ${className} (@${nonNullName} ${this.inferType(imports, info)} value) {`)
      code.push(`        // HACK check value`)
      code.push(`        this.value = value;`)
      code.push(`    }`)
      code.push(`}`)
    } else {
      // 普通class类型
      code.push(`public class ${this.getDomainObjectName(info)} {`)
      code.push(`    private final ${this.inferType(imports, info)} value;`)
      code.push(``)
      code.push(`    public ${className} (@${nonNullName} ${this.inferType(imports, info)} value) {`)
      code.push(`        // HACK check value`)
      code.push(`        this.value = value;`)
      code.push(`    }`)
      code.push(``)
      code.push(`    public ${this.inferType(imports, info)} getValue() {`)
      code.push(`        return this.value;`)
      code.push(`    }`)
      code.push(`}`)
    }
    return {
      imports,
      content: code.join('\n'),
    }
  }
  override getReadModelCode(_readModel: DomainDesignReadModel<DomainDesignInfoRecord>): CodeSnippets {
    throw new Error('Method not implemented.')
  }
  override generate(): CodeFile[] {
    const result: CodeFile[] = []
    return result
  }
}
