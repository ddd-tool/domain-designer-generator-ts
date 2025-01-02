import { expect, it } from 'vitest'
import { createDomainDesigner } from '@ddd-tool/domain-designer-core'
import { JavaGeneratorAddition } from '../domain/define'
import { JavaGeneratorTemplate } from '../java-generator'

const designer = createDomainDesigner()
const i = designer.info
const event = designer.event('messageSentEvent', [i.id('id'), 'content', 'createTime'])

it('', () => {
  const javaGeneratorTemplate = new JavaGeneratorTemplate({
    additions: [JavaGeneratorAddition.Lombok],
    moduleName: 'test',
    namespace: 'com.example',
    designer,
    nonNullAnnotation: 'NonNull',
    nullableAnnotation: 'Nullable',
  })
  const eventSnippets = javaGeneratorTemplate.getEventCode(event)
  expect(JSON.stringify(eventSnippets.imports) + eventSnippets.content).toBe('')
})
