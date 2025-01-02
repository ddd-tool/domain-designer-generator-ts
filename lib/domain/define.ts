import {
  DomainDesigner,
  DomainDesignInfo,
  DomainDesignInfoType,
  DomainDesignObject,
  DomainDesignReadModel,
  isDomainDesignAgg,
  isDomainDesignCommand,
  isDomainDesignEvent,
  isDomainDesignFacadeCommand,
  isDomainDesignReadModel,
  type DomainDesignAgg,
  type DomainDesignCommand,
  type DomainDesignEvent,
  type DomainDesignFacadeCommand,
  type DomainDesignInfoRecord,
} from '@ddd-tool/domain-designer-core'
import { strUtil } from '../common'

export type DomainNode =
  | DomainDesignCommand<DomainDesignInfoRecord>
  | DomainDesignFacadeCommand<DomainDesignInfoRecord>
  | DomainDesignAgg<DomainDesignInfoRecord>
  | DomainDesignEvent<DomainDesignInfoRecord>
  | DomainDesignReadModel<DomainDesignInfoRecord>

export function isStruct(o: object): o is DomainNode {
  return (
    isDomainDesignCommand(o) ||
    isDomainDesignFacadeCommand(o) ||
    isDomainDesignAgg(o) ||
    isDomainDesignEvent(o) ||
    isDomainDesignReadModel(o)
  )
}

export enum Language {
  Java = 'java',
  Kotlin = 'kotlin',
  CSharp = 'csharp',
  Go = 'go',
}

export interface CodeFile {
  imports: Set<string>
  dir: string
  name: string
  ext: string
  content: string
}
export interface CodeSnippets {
  imports: Set<string>
  content: string
}

// ***************************************************************************
// 生成器选项
// ***************************************************************************
export enum JavaGeneratorAddition {
  Lombok = 'Lombok',
  LombokBuilder = 'LombokBuilder',
  RecordVakueObject = 'RecordVakueObject',
  CommandHandler = 'CommandHandler',
  Jpa = 'Jpa',
  Timezone = 'Timezone',
}
export enum KotlinGeneratorAddition {}
export enum CSharpGeneratorAddition {}
export enum GoGeneratorAddition {}

export type GeneratorAddition<LANG extends Language> = LANG extends 'java'
  ? JavaGeneratorAddition
  : LANG extends 'kotlin'
  ? KotlinGeneratorAddition
  : LANG extends 'csharp'
  ? CSharpGeneratorAddition
  : LANG extends 'go'
  ? GoGeneratorAddition
  : never

// ***************************************************************************
// 生成器模板
// ***************************************************************************
export abstract class GeneratorTemplate<LANG extends Language, ADDI = GeneratorAddition<LANG>> {
  protected readonly designer: DomainDesigner
  protected namespace: string
  protected moduleName: string
  protected additions: Set<ADDI> = new Set()
  protected codeFiles: Record<string, CodeFile> = {}

  constructor(init: { designer: DomainDesigner; namespace: string; moduleName: string; additions: ADDI[] }) {
    this.designer = init.designer
    this.namespace = init.namespace
    this.moduleName = init.moduleName
    if (init.additions) {
      for (const addi of init.additions) {
        this.additions.add(addi)
      }
    }
  }
  getDomainObjectName(obj: DomainDesignObject): string {
    return strUtil.stringToUpperCamel(obj._attributes.name)
  }
  abstract inferType(imports: Set<string>, obj: DomainDesignObject): string
  abstract getFileName(struct: DomainDesignObject): string
  abstract getCommandCode(cmd: DomainDesignCommand<DomainDesignInfoRecord>): CodeSnippets
  abstract getFacadeCommandCode(cmd: DomainDesignFacadeCommand<DomainDesignInfoRecord>): CodeSnippets
  abstract getAggCode(agg: DomainDesignAgg<DomainDesignInfoRecord>): CodeSnippets
  abstract getEventCode(event: DomainDesignEvent<DomainDesignInfoRecord>): CodeSnippets
  abstract getInfoCode(info: DomainDesignInfo<DomainDesignInfoType, string>): CodeSnippets
  abstract getReadModelCode(readModel: DomainDesignReadModel<DomainDesignInfoRecord>): CodeSnippets
  abstract generate(): CodeFile[]
}
