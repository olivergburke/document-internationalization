/// <reference types="react" />

import {DocumentActionComponent} from 'sanity'
import type {FieldDefinition} from 'sanity'
import type {KeyedObject} from 'sanity'
import type {ObjectSchemaType} from 'sanity'
import {Plugin as Plugin_2} from 'sanity'
import type {Reference} from 'sanity'
import type {SanityClient} from 'sanity'

export declare const DeleteTranslationAction: DocumentActionComponent

export declare const documentInternationalization: Plugin_2<PluginConfig>

export declare function DocumentInternationalizationMenu(
  props: DocumentInternationalizationMenuProps
): JSX.Element | null

export declare type DocumentInternationalizationMenuProps = {
  schemaType: ObjectSchemaType
  documentId: string
}

export declare type Language = {
  id: Intl.UnicodeBCP47LocaleIdentifier
  title: string
}

export declare type Metadata = {
  _id: string
  _createdAt: string
  translations: TranslationReference[]
}

export declare type PluginConfig = {
  supportedLanguages: SupportedLanguages
  schemaTypes: string[]
  languageField?: string
  weakReferences?: boolean
  bulkPublish?: boolean
  metadataFields?: FieldDefinition[]
  apiVersion?: string
}

export declare type PluginConfigContext = Required<PluginConfig> & {
  supportedLanguages: Language[]
}

export declare type SupportedLanguages =
  | Language[]
  | ((client: SanityClient) => Promise<Language[]>)

export declare type TranslationReference = KeyedObject & {
  _type: 'internationalizedArrayReferenceValue'
  value: Reference
}

export declare function useDocumentInternationalizationContext(): PluginConfigContext

export {}
