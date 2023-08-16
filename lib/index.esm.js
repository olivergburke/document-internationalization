var _templateObject;
function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { TrashIcon, CogIcon, SplitVerticalIcon, CheckmarkIcon, AddIcon, EditIcon, TranslateIcon, InfoOutlineIcon } from '@sanity/icons';
import { Flex, Spinner, Stack, Text, Card, Grid, Button, useToast, Tooltip, Box, Badge, useClickOutside, TextInput, Popover, Inline, Dialog } from '@sanity/ui';
import { useMemo, useEffect, createContext, useContext, useState, useCallback } from 'react';
import { useSchema, Preview, useClient, useEditState, useValidationStatus, TextWithTone, useWorkspace, PatchEvent, unset, defineType, defineField, definePlugin, isSanityDocument } from 'sanity';
import { Feedback, useListeningQuery } from 'sanity-plugin-utils';
import { uuid } from '@sanity/uuid';
import { usePaneRouter, useDocumentPane } from 'sanity/desk';
import { RouterContext } from 'sanity/router';
import styled from 'styled-components';
import { internationalizedArray } from 'sanity-plugin-internationalized-array';
function DocumentPreview(props) {
  const schema = useSchema();
  const schemaType = schema.get(props.type);
  if (!schemaType) {
    return /* @__PURE__ */jsx(Feedback, {
      tone: "critical",
      title: "Schema type not found"
    });
  }
  return /* @__PURE__ */jsx(Preview, {
    value: props.value,
    schemaType
  });
}
const METADATA_SCHEMA_NAME = "translation.metadata";
const TRANSLATIONS_ARRAY_NAME = "translations";
const API_VERSION = "2023-05-22";
const DEFAULT_CONFIG = {
  supportedLanguages: [],
  schemaTypes: [],
  languageField: "language",
  weakReferences: false,
  bulkPublish: false,
  metadataFields: [],
  apiVersion: API_VERSION
};
function separateReferences() {
  let data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  const translations = [];
  const otherReferences = [];
  if (data && data.length > 0) {
    data.forEach(doc => {
      if (doc._type === METADATA_SCHEMA_NAME) {
        translations.push(doc);
      } else {
        otherReferences.push(doc);
      }
    });
  }
  return {
    translations,
    otherReferences
  };
}
function DeleteTranslationDialog(props) {
  const {
    doc,
    documentId,
    setTranslations
  } = props;
  const {
    data,
    loading
  } = useListeningQuery("*[references($id)]{_id, _type}", {
    params: {
      id: documentId
    },
    initialValue: []
  });
  const {
    translations,
    otherReferences
  } = useMemo(() => separateReferences(data), [data]);
  useEffect(() => {
    setTranslations(translations);
  }, [setTranslations, translations]);
  if (loading) {
    return /* @__PURE__ */jsx(Flex, {
      padding: 4,
      align: "center",
      justify: "center",
      children: /* @__PURE__ */jsx(Spinner, {})
    });
  }
  return /* @__PURE__ */jsxs(Stack, {
    space: 4,
    children: [translations && translations.length > 0 ? /* @__PURE__ */jsx(Text, {
      children: "This document is a language-specific version which other translations depend on."
    }) : /* @__PURE__ */jsx(Text, {
      children: "This document does not have connected translations."
    }), /* @__PURE__ */jsx(Card, {
      border: true,
      padding: 3,
      children: /* @__PURE__ */jsxs(Stack, {
        space: 4,
        children: [/* @__PURE__ */jsx(Text, {
          size: 1,
          weight: "semibold",
          children: translations && translations.length > 0 ? /* @__PURE__ */jsx(Fragment, {
            children: "Before this document can be deleted"
          }) : /* @__PURE__ */jsx(Fragment, {
            children: "This document can now be deleted"
          })
        }), /* @__PURE__ */jsx(DocumentPreview, {
          value: doc,
          type: doc._type
        }), translations && translations.length > 0 ? /* @__PURE__ */jsxs(Fragment, {
          children: [/* @__PURE__ */jsx(Card, {
            borderTop: true
          }), /* @__PURE__ */jsxs(Text, {
            size: 1,
            weight: "semibold",
            children: ["The reference in", " ", translations.length === 1 ? "this translations document" : "these translations documents", " ", "must be removed"]
          }), translations.map(translation => /* @__PURE__ */jsx(DocumentPreview, {
            value: translation,
            type: translation._type
          }, translation._id))]
        }) : null, otherReferences && otherReferences.length > 0 ? /* @__PURE__ */jsxs(Fragment, {
          children: [/* @__PURE__ */jsx(Card, {
            borderTop: true
          }), /* @__PURE__ */jsxs(Text, {
            size: 1,
            weight: "semibold",
            children: [otherReferences.length === 1 ? "There is an additional reference" : "There are additional references", " ", "to this document"]
          }), otherReferences.map(reference => /* @__PURE__ */jsx(DocumentPreview, {
            value: reference,
            type: reference._type
          }, reference._id))]
        }) : null]
      })
    }), otherReferences.length === 0 ? /* @__PURE__ */jsx(Text, {
      children: "This document has no other references."
    }) : /* @__PURE__ */jsx(Text, {
      children: "You may not be able to delete this document because other documents refer to it."
    })]
  });
}
function DeleteTranslationFooter(props) {
  const {
    translations,
    onClose,
    onProceed
  } = props;
  return /* @__PURE__ */jsxs(Grid, {
    columns: 2,
    gap: 2,
    children: [/* @__PURE__ */jsx(Button, {
      text: "Cancel",
      onClick: onClose,
      mode: "ghost"
    }), /* @__PURE__ */jsx(Button, {
      text: translations && translations.length > 0 ? "Unset translation reference" : "Delete document",
      onClick: onProceed,
      tone: "critical"
    })]
  });
}
function shallowEqualArrays(arrA, arrB) {
  let equal = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : (a, b) => a === b;
  if (arrA === arrB) return true;
  if (!arrA || !arrB) return false;
  const len = arrA.length;
  if (arrB.length !== len) return false;
  for (let i = 0; i < len; i++) if (!equal(arrA[i], arrB[i])) return false;
  return true;
}
const globalCache = [];
function query$1(fn, keys) {
  let preload = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  let config = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
  for (const entry of globalCache) {
    // Find a match
    if (shallowEqualArrays(keys, entry.keys, entry.equal)) {
      // If we're pre-loading and the element is present, just return
      if (preload) return undefined; // If an error occurred, throw

      if (Object.prototype.hasOwnProperty.call(entry, 'error')) throw entry.error; // If a response was successful, return

      if (Object.prototype.hasOwnProperty.call(entry, 'response')) return entry.response; // If the promise is still unresolved, throw

      if (!preload) throw entry.promise;
    }
  } // The request is new or has changed.

  const entry = {
    keys,
    equal: config.equal,
    promise:
    // Execute the promise
    fn(...keys) // When it resolves, store its value
    .then(response => entry.response = response) // Remove the entry if a lifespan was given
    .then(() => {
      if (config.lifespan && config.lifespan > 0) {
        setTimeout(() => {
          const index = globalCache.indexOf(entry);
          if (index !== -1) globalCache.splice(index, 1);
        }, config.lifespan);
      }
    }) // Store caught errors, they will be thrown in the render-phase to bubble into an error-bound
    .catch(error => entry.error = error)
  }; // Register the entry

  globalCache.push(entry); // And throw the promise, this yields control back to React

  if (!preload) throw entry.promise;
  return undefined;
}
const suspend = (fn, keys, config) => query$1(fn, keys, false, config);
const DocumentInternationalizationContext = createContext(DEFAULT_CONFIG);
function useDocumentInternationalizationContext() {
  return useContext(DocumentInternationalizationContext);
}
function DocumentInternationalizationProvider(props) {
  const {
    pluginConfig
  } = props;
  const client = useClient({
    apiVersion: pluginConfig.apiVersion
  });
  const supportedLanguages = Array.isArray(pluginConfig.supportedLanguages) ? pluginConfig.supportedLanguages :
  // eslint-disable-next-line require-await
  suspend(async () => {
    if (typeof pluginConfig.supportedLanguages === "function") {
      return pluginConfig.supportedLanguages(client);
    }
    return pluginConfig.supportedLanguages;
  }, []);
  return /* @__PURE__ */jsx(DocumentInternationalizationContext.Provider, {
    value: {
      ...pluginConfig,
      supportedLanguages
    },
    children: props.renderDefault(props)
  });
}
const DeleteTranslationAction = props => {
  const {
    id: documentId,
    published,
    draft
  } = props;
  const doc = draft || published;
  const {
    languageField
  } = useDocumentInternationalizationContext();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [translations, setTranslations] = useState([]);
  const onClose = useCallback(() => setDialogOpen(false), []);
  const documentLanguage = doc ? doc[languageField] : null;
  const toast = useToast();
  const client = useClient({
    apiVersion: API_VERSION
  });
  const onProceed = useCallback(() => {
    const tx = client.transaction();
    let operation = "DELETE";
    if (documentLanguage && translations.length > 0) {
      operation = "UNSET";
      translations.forEach(translation => {
        tx.patch(translation._id, patch => patch.unset(["".concat(TRANSLATIONS_ARRAY_NAME, "[_key == \"").concat(documentLanguage, "\"]")]));
      });
    } else {
      tx.delete(documentId);
      tx.delete("drafts.".concat(documentId));
    }
    tx.commit().then(() => {
      if (operation === "DELETE") {
        onClose();
      }
      toast.push({
        status: "success",
        title: operation === "UNSET" ? "Translation reference unset" : "Document deleted",
        description: operation === "UNSET" ? "The document can now be deleted" : null
      });
    }).catch(err => {
      toast.push({
        status: "error",
        title: operation === "unset" ? "Failed to unset translation reference" : "Failed to delete document",
        description: err.message
      });
    });
  }, [client, documentLanguage, translations, documentId, onClose, toast]);
  return {
    label: "Delete translation...",
    disabled: !doc || !documentLanguage,
    icon: TrashIcon,
    tone: "critical",
    onHandle: () => {
      setDialogOpen(true);
    },
    dialog: isDialogOpen && {
      type: "dialog",
      onClose,
      header: "Delete translation",
      content: doc ? /* @__PURE__ */jsx(DeleteTranslationDialog, {
        doc,
        documentId,
        setTranslations
      }) : null,
      footer: /* @__PURE__ */jsx(DeleteTranslationFooter, {
        onClose,
        onProceed,
        translations
      })
    }
  };
};
const query = "*[_type == $translationSchema && $id in translations[].value._ref]{\n  _id,\n  _createdAt,\n  translations\n}";
function useTranslationMetadata(id) {
  const {
    data,
    loading,
    error
  } = useListeningQuery(query, {
    params: {
      id,
      translationSchema: METADATA_SCHEMA_NAME
    }
  });
  return {
    data,
    loading,
    error
  };
}
function useOpenInNewPane(id, type) {
  const routerContext = useContext(RouterContext);
  const {
    routerPanesState,
    groupIndex
  } = usePaneRouter();
  const openInNewPane = useCallback(() => {
    if (!routerContext || !id || !type) {
      return;
    }
    if (!routerPanesState.length) {
      routerContext.navigateIntent("edit", {
        id,
        type
      });
      return;
    }
    const panes = [...routerPanesState];
    panes.splice(groupIndex + 1, 0, [{
      id,
      params: {
        type
      }
    }]);
    const href = routerContext.resolvePathFromState({
      panes
    });
    routerContext.navigateUrl({
      path: href
    });
  }, [id, type, routerContext, routerPanesState, groupIndex]);
  return openInNewPane;
}
function LanguageManage(props) {
  const {
    id
  } = props;
  const open = useOpenInNewPane(id, METADATA_SCHEMA_NAME);
  return /* @__PURE__ */jsx(Tooltip, {
    content: id ? null : /* @__PURE__ */jsx(Box, {
      padding: 2,
      children: /* @__PURE__ */jsx(Text, {
        muted: true,
        size: 1,
        children: "Document has no other translations"
      })
    }),
    fallbackPlacements: ["right", "left"],
    placement: "top",
    portal: true,
    children: /* @__PURE__ */jsx(Stack, {
      children: /* @__PURE__ */jsx(Button, {
        disabled: !id,
        mode: "ghost",
        text: "Manage Translations",
        icon: CogIcon,
        onClick: () => open()
      })
    })
  });
}
function useOpenInCurrentPane(id, type) {
  const routerContext = useContext(RouterContext);
  const {
    routerPanesState,
    groupIndex
  } = usePaneRouter();
  const openInCurrentPane = useCallback(() => {
    if (!routerContext || !id || !type) {
      return;
    }
    if (!routerPanesState.length) {
      routerContext.navigateIntent("edit", {
        id,
        type
      });
      return;
    }
    const panes = [...routerPanesState];
    panes.splice(groupIndex, 1, [{
      id,
      params: {
        type
      }
    }]);
    const href = routerContext.resolvePathFromState({
      panes
    });
    routerContext.navigateUrl({
      path: href
    });
  }, [id, type, routerContext, routerPanesState, groupIndex]);
  return openInCurrentPane;
}
function createReference(key, ref, type) {
  let strengthenOnPublish = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
  return {
    _key: key,
    _type: "internationalizedArrayReferenceValue",
    value: {
      _type: "reference",
      _ref: ref,
      _weak: true,
      // If the user has configured weakReferences, we won't want to strengthen them
      ...(strengthenOnPublish ? {
        _strengthenOnPublish: {
          type
        }
      } : {})
    }
  };
}
function LanguageOption(props) {
  var _a;
  const {
    language,
    schemaType,
    documentId,
    current,
    source,
    sourceLanguageId,
    metadata,
    metadataId
  } = props;
  const disabled = props.disabled || current || !source || !sourceLanguageId || !metadataId;
  const translation = (metadata == null ? void 0 : metadata.translations.length) ? metadata.translations.find(t => t._key === language.id) : void 0;
  const {
    apiVersion,
    languageField,
    weakReferences
  } = useDocumentInternationalizationContext();
  const client = useClient({
    apiVersion
  });
  const toast = useToast();
  const open = useOpenInCurrentPane((_a = translation == null ? void 0 : translation.value) == null ? void 0 : _a._ref, schemaType);
  const handleOpen = useCallback(() => open(), [open]);
  const handleCreate = useCallback(async () => {
    if (!source) {
      throw new Error("Cannot create translation without source document");
    }
    if (!sourceLanguageId) {
      throw new Error("Cannot create translation without source language ID");
    }
    if (!metadataId) {
      throw new Error("Cannot create translation without a metadata ID");
    }
    const transaction = client.transaction();
    const newTranslationDocumentId = uuid();
    const newTranslationDocument = {
      ...source,
      _id: "drafts.".concat(newTranslationDocumentId),
      // 2. Update language of the translation
      [languageField]: language.id
    };
    transaction.create(newTranslationDocument);
    const sourceReference = createReference(sourceLanguageId, documentId, schemaType, !weakReferences);
    const newTranslationReference = createReference(language.id, newTranslationDocumentId, schemaType, !weakReferences);
    const newMetadataDocument = {
      _id: metadataId,
      _type: METADATA_SCHEMA_NAME,
      schemaTypes: [schemaType],
      translations: [sourceReference]
    };
    transaction.createIfNotExists(newMetadataDocument);
    const metadataPatch = client.patch(metadataId).setIfMissing({
      translations: [sourceReference]
    }).insert("after", "translations[-1]", [newTranslationReference]);
    transaction.patch(metadataPatch);
    transaction.commit().then(() => {
      const metadataExisted = Boolean(metadata == null ? void 0 : metadata._createdAt);
      return toast.push({
        status: "success",
        title: "Created \"".concat(language.title, "\" translation"),
        description: metadataExisted ? "Updated Translations Metadata" : "Created Translations Metadata"
      });
    }).catch(err => {
      console.error(err);
      return toast.push({
        status: "error",
        title: "Error creating translation",
        description: err.message
      });
    });
  }, [client, documentId, language.id, language.title, languageField, metadata == null ? void 0 : metadata._createdAt, metadataId, schemaType, source, sourceLanguageId, toast]);
  let message;
  if (current) {
    message = "Current document";
  } else if (translation) {
    message = "Open ".concat(language.title, " translation");
  } else if (!translation) {
    message = "Create new ".concat(language.title, " translation");
  }
  return /* @__PURE__ */jsx(Tooltip, {
    content: /* @__PURE__ */jsx(Box, {
      padding: 2,
      children: /* @__PURE__ */jsx(Text, {
        muted: true,
        size: 1,
        children: message
      })
    }),
    fallbackPlacements: ["right", "left"],
    placement: "top",
    portal: true,
    children: /* @__PURE__ */jsx(Button, {
      onClick: translation ? handleOpen : handleCreate,
      mode: current && disabled ? "default" : "bleed",
      disabled,
      children: /* @__PURE__ */jsxs(Flex, {
        gap: 3,
        align: "center",
        children: [disabled && !current ? /* @__PURE__ */jsx(Spinner, {}) : /* @__PURE__ */jsx(Text, {
          size: 2,
          children: translation ? /* @__PURE__ */jsx(SplitVerticalIcon, {}) : current ? /* @__PURE__ */jsx(CheckmarkIcon, {}) : /* @__PURE__ */jsx(AddIcon, {})
        }), /* @__PURE__ */jsx(Box, {
          flex: 1,
          children: /* @__PURE__ */jsx(Text, {
            children: language.title
          })
        }), /* @__PURE__ */jsx(Badge, {
          tone: disabled || current ? "default" : "primary",
          children: language.id
        })]
      })
    })
  });
}
function LanguagePatch(props) {
  const {
    language,
    source
  } = props;
  const {
    apiVersion,
    languageField
  } = useDocumentInternationalizationContext();
  const disabled = props.disabled || !source;
  const client = useClient({
    apiVersion
  });
  const toast = useToast();
  const handleClick = useCallback(() => {
    if (!source) {
      throw new Error("Cannot patch missing document");
    }
    const currentId = source._id;
    client.patch(currentId).set({
      [languageField]: language.id
    }).commit().then(() => {
      toast.push({
        title: "Set document language to ".concat(language.title),
        status: "success"
      });
    }).catch(err => {
      console.error(err);
      return toast.push({
        title: "Failed to set document language to ".concat(language.title),
        status: "error"
      });
    });
  }, [source, client, languageField, language, toast]);
  return /* @__PURE__ */jsx(Button, {
    mode: "bleed",
    onClick: handleClick,
    disabled,
    justify: "flex-start",
    children: /* @__PURE__ */jsxs(Flex, {
      gap: 3,
      align: "center",
      children: [/* @__PURE__ */jsx(Text, {
        size: 2,
        children: /* @__PURE__ */jsx(EditIcon, {})
      }), /* @__PURE__ */jsx(Box, {
        flex: 1,
        children: /* @__PURE__ */jsx(Text, {
          children: language.title
        })
      }), /* @__PURE__ */jsx(Badge, {
        children: language.id
      })]
    })
  });
}
var ConstrainedBox = styled(Box)(_templateObject || (_templateObject = _taggedTemplateLiteral(["\n  max-width: 280px;\n"])));
function Warning(_ref) {
  let {
    children
  } = _ref;
  return /* @__PURE__ */jsx(Card, {
    tone: "caution",
    padding: 3,
    children: /* @__PURE__ */jsx(Flex, {
      justify: "center",
      children: /* @__PURE__ */jsx(ConstrainedBox, {
        children: /* @__PURE__ */jsx(Text, {
          size: 1,
          align: "center",
          children
        })
      })
    })
  });
}
function DocumentInternationalizationMenu(props) {
  const {
    documentId
  } = props;
  const schemaType = props.schemaType.name;
  const {
    languageField,
    supportedLanguages
  } = useDocumentInternationalizationContext();
  const [query, setQuery] = useState("");
  const handleQuery = useCallback(event => {
    if (event.currentTarget.value) {
      setQuery(event.currentTarget.value);
    } else {
      setQuery("");
    }
  }, []);
  const [open, setOpen] = useState(false);
  const handleClick = useCallback(() => setOpen(o => !o), []);
  const [button, setButton] = useState(null);
  const [popover, setPopover] = useState(null);
  const handleClickOutside = useCallback(() => setOpen(false), []);
  useClickOutside(handleClickOutside, [button, popover]);
  const {
    data,
    loading,
    error
  } = useTranslationMetadata(documentId);
  const metadata = Array.isArray(data) && data.length ? data[0] : null;
  const metadataId = useMemo(() => {
    var _a;
    if (loading) {
      return null;
    }
    return (_a = metadata == null ? void 0 : metadata._id) != null ? _a : uuid();
  }, [loading, metadata == null ? void 0 : metadata._id]);
  const {
    draft,
    published
  } = useEditState(documentId, schemaType);
  const source = draft || published;
  const documentIsInOneMetadataDocument = useMemo(() => {
    return Array.isArray(data) && data.length <= 1;
  }, [data]);
  const sourceLanguageId = source == null ? void 0 : source[languageField];
  const sourceLanguageIsValid = supportedLanguages.some(l => l.id === sourceLanguageId);
  const allLanguagesAreValid = useMemo(() => {
    const valid = supportedLanguages.every(l => l.id && l.title);
    if (!valid) {
      console.warn("Not all languages are valid. It should be an array of objects with an \"id\" and \"title\" property. Or a function that returns an array of objects with an \"id\" and \"title\" property.", supportedLanguages);
    }
    return valid;
  }, [supportedLanguages]);
  const content = /* @__PURE__ */jsx(Box, {
    padding: 1,
    children: error ? /* @__PURE__ */jsx(Card, {
      tone: "critical",
      padding: 1,
      children: /* @__PURE__ */jsx(Text, {
        children: "There was an error returning translations metadata"
      })
    }) : /* @__PURE__ */jsxs(Stack, {
      space: 1,
      children: [/* @__PURE__ */jsx(LanguageManage, {
        id: metadata == null ? void 0 : metadata._id
      }), supportedLanguages.length > 4 ? /* @__PURE__ */jsx(TextInput, {
        onChange: handleQuery,
        value: query,
        placeholder: "Filter languages"
      }) : null, supportedLanguages.length > 0 ? /* @__PURE__ */jsxs(Fragment, {
        children: [loading ? null : /* @__PURE__ */jsxs(Fragment, {
          children: [data && documentIsInOneMetadataDocument ? null : /* @__PURE__ */jsx(Warning, {
            children: "This document has been found in more than one Translations Metadata documents"
          }), allLanguagesAreValid ? null : /* @__PURE__ */jsx(Warning, {
            children: "Not all language objects are valid. See the console."
          }), sourceLanguageId ? null : /* @__PURE__ */jsxs(Warning, {
            children: ["Choose a language to apply to", " ", /* @__PURE__ */jsx("strong", {
              children: "this Document"
            })]
          }), sourceLanguageId && !sourceLanguageIsValid ? /* @__PURE__ */jsxs(Warning, {
            children: ["Select a supported language. Current language value:", " ", /* @__PURE__ */jsx("code", {
              children: sourceLanguageId
            })]
          }) : null]
        }), supportedLanguages.filter(language => {
          if (query) {
            return language.title.toLowerCase().includes(query.toLowerCase());
          }
          return true;
        }).map(language => {
          var _a;
          return !loading && sourceLanguageId && sourceLanguageIsValid ?
          // Button to duplicate this document to a new translation
          // And either create or update the metadata document
          /* @__PURE__ */
          jsx(LanguageOption, {
            language,
            schemaType,
            documentId,
            disabled: loading || !allLanguagesAreValid,
            current: language.id === sourceLanguageId,
            metadata,
            metadataId,
            source,
            sourceLanguageId
          }, language.id) :
          // Button to set a language field on *this* document
          /* @__PURE__ */
          jsx(LanguagePatch, {
            source,
            language,
            disabled: (_a = loading || !allLanguagesAreValid || (metadata == null ? void 0 : metadata.translations.filter(t => {
              var _a2;
              return ((_a2 = t == null ? void 0 : t.value) == null ? void 0 : _a2._ref) !== documentId;
            }).some(t => t._key === language.id))) != null ? _a : false
          }, language.id);
        })]
      }) : null]
    })
  });
  const issueWithTranslations = !loading && sourceLanguageId && !sourceLanguageIsValid;
  if (!documentId) {
    return null;
  }
  if (!schemaType) {
    return null;
  }
  return /* @__PURE__ */jsx(Popover, {
    constrainSize: true,
    content,
    open,
    portal: true,
    ref: setPopover,
    overflow: "auto",
    tone: "default",
    children: /* @__PURE__ */jsx(Button, {
      text: "Translations",
      mode: "bleed",
      disabled: !source,
      tone: !source || loading || !issueWithTranslations ? void 0 : "caution",
      icon: TranslateIcon,
      onClick: handleClick,
      ref: setButton,
      selected: open
    })
  });
}
const DeleteMetadataAction = props => {
  const {
    id: documentId,
    published,
    draft,
    onComplete
  } = props;
  const doc = draft || published;
  const [isDialogOpen, setDialogOpen] = useState(false);
  const onClose = useCallback(() => setDialogOpen(false), []);
  const translations = useMemo(() => doc && Array.isArray(doc[TRANSLATIONS_ARRAY_NAME]) ? doc[TRANSLATIONS_ARRAY_NAME] : [], [doc]);
  const toast = useToast();
  const client = useClient({
    apiVersion: API_VERSION
  });
  const onProceed = useCallback(() => {
    const tx = client.transaction();
    tx.patch(documentId, patch => patch.unset([TRANSLATIONS_ARRAY_NAME]));
    if (translations.length > 0) {
      translations.forEach(translation => {
        tx.delete(translation.value._ref);
        tx.delete("drafts.".concat(translation.value._ref));
      });
    }
    tx.delete(documentId);
    tx.delete("drafts.".concat(documentId));
    tx.commit().then(() => {
      onClose();
      toast.push({
        status: "success",
        title: "Deleted document and translations"
      });
    }).catch(err => {
      toast.push({
        status: "error",
        title: "Failed to delete document and translations",
        description: err.message
      });
    });
  }, [client, translations, documentId, onClose, toast]);
  return {
    label: "Delete all translations",
    disabled: !doc || !translations.length,
    icon: TrashIcon,
    tone: "critical",
    onHandle: () => {
      setDialogOpen(true);
    },
    dialog: isDialogOpen && {
      type: "confirm",
      onCancel: onComplete,
      onConfirm: () => {
        onProceed();
        onComplete();
      },
      tone: "critical",
      message: translations.length === 1 ? "Delete 1 translation and this document" : "Delete all ".concat(translations.length, " translations and this document")
    }
  };
};
function LanguageBadge(props) {
  var _a, _b;
  const source = (props == null ? void 0 : props.draft) || (props == null ? void 0 : props.published);
  const {
    languageField,
    supportedLanguages
  } = useDocumentInternationalizationContext();
  const languageId = source == null ? void 0 : source[languageField];
  if (!languageId) {
    return null;
  }
  const language = Array.isArray(supportedLanguages) ? supportedLanguages.find(l => l.id === languageId) : null;
  return {
    label: (_a = language == null ? void 0 : language.id) != null ? _a : String(languageId),
    title: (_b = language == null ? void 0 : language.title) != null ? _b : void 0,
    color: "primary"
  };
}
function DocumentCheck(props) {
  const {
    id,
    onCheckComplete,
    addInvalidId,
    removeInvalidId,
    addDraftId,
    removeDraftId
  } = props;
  const editState = useEditState(id, "");
  const {
    isValidating,
    validation
  } = useValidationStatus(id, "");
  const schema = useSchema();
  const validationHasErrors = useMemo(() => {
    return !isValidating && validation.length > 0 && validation.some(item => item.level === "error");
  }, [isValidating, validation]);
  useEffect(() => {
    if (validationHasErrors) {
      addInvalidId(id);
    } else {
      removeInvalidId(id);
    }
    if (editState.draft) {
      addDraftId(id);
    } else {
      removeDraftId(id);
    }
    if (!isValidating) {
      onCheckComplete(id);
    }
  }, [addDraftId, addInvalidId, editState.draft, id, isValidating, onCheckComplete, removeDraftId, removeInvalidId, validationHasErrors]);
  if (!editState.draft) {
    return null;
  }
  const schemaType = schema.get(editState.draft._type);
  return /* @__PURE__ */jsx(Card, {
    border: true,
    padding: 2,
    tone: validationHasErrors ? "critical" : "positive",
    children: editState.draft && schemaType ? /* @__PURE__ */jsx(Preview, {
      layout: "default",
      value: editState.draft,
      schemaType
    }) : /* @__PURE__ */jsx(Spinner, {})
  });
}
function InfoIcon(props) {
  const {
    text,
    icon,
    tone,
    children
  } = props;
  const Icon = icon;
  return /* @__PURE__ */jsx(Tooltip, {
    portal: true,
    content: children ? /* @__PURE__ */jsx(Fragment, {
      children
    }) : /* @__PURE__ */jsx(Box, {
      padding: 2,
      children: /* @__PURE__ */jsx(Text, {
        size: 1,
        children: text
      })
    }),
    children: /* @__PURE__ */jsx(TextWithTone, {
      tone,
      size: 1,
      children: /* @__PURE__ */jsx(Icon, {})
    })
  });
}
function Info() {
  return /* @__PURE__ */jsx(InfoIcon, {
    icon: InfoOutlineIcon,
    tone: "primary",
    children: /* @__PURE__ */jsxs(Stack, {
      padding: 3,
      space: 4,
      style: {
        maxWidth: 250
      },
      children: [/* @__PURE__ */jsx(Box, {
        children: /* @__PURE__ */jsx(Text, {
          size: 1,
          children: "Bulk publishing uses the Scheduling API."
        })
      }), /* @__PURE__ */jsx(Box, {
        children: /* @__PURE__ */jsx(Text, {
          size: 1,
          children: "Customized Document Actions in the Studio will not execute. Webhooks will execute."
        })
      }), /* @__PURE__ */jsx(Box, {
        children: /* @__PURE__ */jsx(Text, {
          size: 1,
          children: "Validation is checked before rendering the button below, but the Scheduling API will not check for \u2013 or enforce \u2013 validation."
        })
      })]
    })
  });
}
function BulkPublish(props) {
  const {
    translations
  } = props;
  const client = useClient({
    apiVersion: API_VERSION
  });
  const {
    projectId,
    dataset
  } = useWorkspace();
  const toast = useToast();
  const [invalidIds, setInvalidIds] = useState(null);
  const [checkedIds, setCheckedIds] = useState([]);
  const onCheckComplete = useCallback(id => {
    setCheckedIds(ids => Array.from( /* @__PURE__ */new Set([...ids, id])));
  }, []);
  const [open, setOpen] = useState(false);
  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);
  const addInvalidId = useCallback(id => {
    setInvalidIds(ids => ids ? Array.from( /* @__PURE__ */new Set([...ids, id])) : [id]);
  }, []);
  const removeInvalidId = useCallback(id => {
    setInvalidIds(ids => ids ? ids.filter(i => i !== id) : []);
  }, []);
  const [draftIds, setDraftIds] = useState([]);
  const addDraftId = useCallback(id => {
    setDraftIds(ids => Array.from( /* @__PURE__ */new Set([...ids, id])));
  }, []);
  const removeDraftId = useCallback(id => {
    setDraftIds(ids => ids.filter(i => i !== id));
  }, []);
  const handleBulkPublish = useCallback(() => {
    const body = translations.map(translation => ({
      documentId: translation.value._ref
    }));
    client.request({
      uri: "/publish/".concat(projectId, "/").concat(dataset),
      method: "POST",
      body
    }).then(() => {
      toast.push({
        status: "success",
        title: "Success",
        description: "Bulk publish complete"
      });
    }).catch(err => {
      console.error(err);
      toast.push({
        status: "error",
        title: "Error",
        description: "Bulk publish failed"
      });
    });
  }, [translations, client, projectId, dataset, toast]);
  const disabled =
  // Not all documents have been checked
  checkedIds.length !== translations.length ||
  // Some document(s) are invalid
  Boolean(invalidIds && (invalidIds == null ? void 0 : invalidIds.length) > 0) ||
  // No documents are drafts
  !draftIds.length;
  return (translations == null ? void 0 : translations.length) > 0 ? /* @__PURE__ */jsx(Card, {
    padding: 4,
    border: true,
    radius: 2,
    children: /* @__PURE__ */jsxs(Stack, {
      space: 3,
      children: [/* @__PURE__ */jsxs(Inline, {
        space: 3,
        children: [/* @__PURE__ */jsx(Text, {
          weight: "bold",
          size: 1,
          children: "Bulk publishing"
        }), /* @__PURE__ */jsx(Info, {})]
      }), /* @__PURE__ */jsx(Stack, {
        children: /* @__PURE__ */jsx(Button, {
          onClick: onOpen,
          text: "Prepare bulk publishing",
          mode: "ghost"
        })
      }), open && /* @__PURE__ */jsx(Dialog, {
        header: "Bulk publishing",
        id: "bulk-publish-dialog",
        onClose,
        zOffset: 1e3,
        width: 3,
        children: /* @__PURE__ */jsxs(Stack, {
          space: 4,
          padding: 4,
          children: [draftIds.length > 0 ? /* @__PURE__ */jsxs(Stack, {
            space: 2,
            children: [/* @__PURE__ */jsxs(Text, {
              size: 1,
              children: ["There", " ", draftIds.length === 1 ? "is 1 draft document" : "are ".concat(draftIds.length, " draft documents"), "."]
            }), invalidIds && invalidIds.length > 0 ? /* @__PURE__ */jsxs(TextWithTone, {
              tone: "critical",
              size: 1,
              children: [invalidIds && invalidIds.length === 1 ? "1 draft document has" : "".concat(invalidIds && invalidIds.length, " draft documents have"), " ", "validation issues that must addressed first"]
            }) : /* @__PURE__ */jsx(TextWithTone, {
              tone: "positive",
              size: 1,
              children: "All drafts are valid and can be bulk published"
            })]
          }) : null, /* @__PURE__ */jsx(Stack, {
            space: 1,
            children: translations.filter(translation => {
              var _a;
              return (_a = translation == null ? void 0 : translation.value) == null ? void 0 : _a._ref;
            }).map(translation => /* @__PURE__ */jsx(DocumentCheck, {
              id: translation.value._ref,
              onCheckComplete,
              addInvalidId,
              removeInvalidId,
              addDraftId,
              removeDraftId
            }, translation._key))
          }), draftIds.length > 0 ? /* @__PURE__ */jsx(Button, {
            mode: "ghost",
            tone: invalidIds && (invalidIds == null ? void 0 : invalidIds.length) > 0 ? "caution" : "positive",
            text: draftIds.length === 1 ? "Publish draft document" : "Bulk publish ".concat(draftIds.length, " draft documents"),
            onClick: handleBulkPublish,
            disabled
          }) : /* @__PURE__ */jsx(Text, {
            muted: true,
            size: 1,
            children: "No draft documents to publish"
          })]
        })
      })]
    })
  }) : null;
}
function ReferencePatcher(props) {
  const {
    translation,
    documentType,
    metadataId
  } = props;
  const editState = useEditState(translation.value._ref, documentType);
  const client = useClient({
    apiVersion: API_VERSION
  });
  const {
    onChange
  } = useDocumentPane();
  useEffect(() => {
    if (
    // We have a reference
    translation.value._ref &&
    // It's still weak and not-yet-strengthened
    translation.value._weak &&
    // We also want to keep this check because maybe the user *configured* weak refs
    translation.value._strengthenOnPublish &&
    // The referenced document has just been published
    !editState.draft && editState.published && editState.ready) {
      const referencePathBase = ["translations", {
        _key: translation._key
      }, "value"];
      onChange(new PatchEvent([unset([...referencePathBase, "_weak"]), unset([...referencePathBase, "_strengthenOnPublish"])]));
    }
  }, [translation, editState, metadataId, client, onChange]);
  return null;
}
function OptimisticallyStrengthen(props) {
  const {
    translations = [],
    metadataId
  } = props;
  if (!translations.length) {
    return null;
  }
  return /* @__PURE__ */jsx(Fragment, {
    children: translations.map(translation => {
      var _a;
      return ((_a = translation.value._strengthenOnPublish) == null ? void 0 : _a.type) ? /* @__PURE__ */jsx(ReferencePatcher, {
        translation,
        documentType: translation.value._strengthenOnPublish.type,
        metadataId
      }, translation._key) : null;
    })
  });
}
var metadata = (schemaTypes, metadataFields) => defineType({
  type: "document",
  name: METADATA_SCHEMA_NAME,
  title: "Translation metadata",
  icon: TranslateIcon,
  liveEdit: true,
  fields: [defineField({
    name: TRANSLATIONS_ARRAY_NAME,
    type: "internationalizedArrayReference"
  }), defineField({
    name: "schemaTypes",
    description: "Optional: Used to filter the reference fields above so all translations share the same types.",
    type: "array",
    // For some reason TS dislikes this line because of the DocumentDefinition return type
    // @ts-expect-error
    of: [{
      type: "string"
    }],
    options: {
      list: schemaTypes
    },
    readOnly: _ref2 => {
      let {
        value
      } = _ref2;
      return Boolean(value);
    }
  }), ...metadataFields],
  preview: {
    select: {
      translations: TRANSLATIONS_ARRAY_NAME,
      documentSchemaTypes: "schemaTypes"
    },
    prepare(selection) {
      const {
        translations = [],
        documentSchemaTypes = []
      } = selection;
      const title = translations.length === 1 ? "1 Translation" : "".concat(translations.length, " Translations");
      const languageKeys = translations.length ? translations.map(t => t._key.toUpperCase()).join(", ") : "";
      const subtitle = [languageKeys ? "(".concat(languageKeys, ")") : null, (documentSchemaTypes == null ? void 0 : documentSchemaTypes.length) ? documentSchemaTypes.map(s => s).join(", ") : ""].filter(Boolean).join(" ");
      return {
        title,
        subtitle
      };
    }
  }
});
const documentInternationalization = definePlugin(config => {
  const pluginConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };
  const {
    supportedLanguages,
    schemaTypes,
    languageField,
    bulkPublish,
    metadataFields
  } = pluginConfig;
  if (schemaTypes.length === 0) {
    throw new Error("You must specify at least one schema type on which to enable document internationalization. Update the `schemaTypes` option in the documentInternationalization() configuration.");
  }
  return {
    name: "@sanity/document-internationalization",
    studio: {
      components: {
        layout: props => DocumentInternationalizationProvider({
          ...props,
          pluginConfig
        })
      }
    },
    // Adds:
    // - A bulk-publishing UI component to the form
    // - Will only work for projects on a compatible plan
    form: {
      components: {
        input: props => {
          var _a, _b, _c;
          if (props.id === "root" && props.schemaType.name === METADATA_SCHEMA_NAME && isSanityDocument(props == null ? void 0 : props.value)) {
            const metadataId = (_a = props == null ? void 0 : props.value) == null ? void 0 : _a._id;
            const translations = (_c = (_b = props == null ? void 0 : props.value) == null ? void 0 : _b.translations) != null ? _c : [];
            const weakAndTypedTranslations = translations.filter(_ref3 => {
              let {
                value
              } = _ref3;
              return value && value._weak && value._strengthenOnPublish;
            });
            return /* @__PURE__ */jsxs(Stack, {
              space: 5,
              children: [bulkPublish ? /* @__PURE__ */jsx(BulkPublish, {
                translations
              }) : null, weakAndTypedTranslations.length > 0 ? /* @__PURE__ */jsx(OptimisticallyStrengthen, {
                metadataId,
                translations: weakAndTypedTranslations
              }) : null, props.renderDefault(props)]
            });
          }
          return props.renderDefault(props);
        }
      }
    },
    // Adds:
    // - The `Translations` dropdown to the editing form
    // - `Badges` to documents with a language value
    // - The `DeleteMetadataAction` action to the metadata document type
    document: {
      unstable_languageFilter: (prev, ctx) => {
        const {
          schemaType,
          documentId
        } = ctx;
        return schemaTypes.includes(schemaType) && documentId ? [...prev, props => DocumentInternationalizationMenu({
          ...props,
          documentId
        })] : prev;
      },
      badges: (prev, _ref4) => {
        let {
          schemaType
        } = _ref4;
        if (!schemaTypes.includes(schemaType)) {
          return prev;
        }
        return [props => LanguageBadge(props), ...prev];
      },
      actions: (prev, _ref5) => {
        let {
          schemaType
        } = _ref5;
        if (schemaType === METADATA_SCHEMA_NAME) {
          return [...prev, DeleteMetadataAction];
        }
        return prev;
      }
    },
    // Adds:
    // - The `Translations metadata` document type to the schema
    schema: {
      // Create the metadata document type
      types: [metadata(schemaTypes, metadataFields)],
      // For every schema type this plugin is enabled on
      // Create an initial value template to set the language
      templates: (prev, _ref6) => {
        let {
          schema
        } = _ref6;
        if (!Array.isArray(supportedLanguages)) {
          return prev;
        }
        const parameterizedTemplates = schemaTypes.map(schemaType => {
          var _a, _b;
          return {
            id: "".concat(schemaType, "-parameterized"),
            title: "".concat((_b = (_a = schema == null ? void 0 : schema.get(schemaType)) == null ? void 0 : _a.title) != null ? _b : schemaType, ": with Language"),
            schemaType,
            parameters: [{
              name: "languageId",
              title: "Language ID",
              type: "string"
            }],
            value: _ref7 => {
              let {
                languageId
              } = _ref7;
              return {
                [languageField]: languageId
              };
            }
          };
        });
        const staticTemplates = schemaTypes.flatMap(schemaType => {
          return supportedLanguages.map(language => {
            var _a, _b;
            return {
              id: "".concat(schemaType, "-").concat(language.id),
              title: "".concat(language.title, " ").concat((_b = (_a = schema == null ? void 0 : schema.get(schemaType)) == null ? void 0 : _a.title) != null ? _b : schemaType),
              schemaType,
              value: {
                [languageField]: language.id
              }
            };
          });
        });
        return [...prev, ...parameterizedTemplates, ...staticTemplates];
      }
    },
    // Uses:
    // - `sanity-plugin-internationalized-array` to maintain the translations array
    plugins: [
    // Translation metadata stores its references using this plugin
    // It cuts down on attribute usage and gives UI conveniences to add new translations
    internationalizedArray({
      languages: supportedLanguages,
      fieldTypes: [defineField({
        name: "reference",
        type: "reference",
        to: schemaTypes.map(type => ({
          type
        })),
        weak: pluginConfig.weakReferences,
        // Reference filters don't actually enforce validation!
        validation: Rule => Rule.custom(async (item, context) => {
          var _a;
          if (!((_a = item == null ? void 0 : item.value) == null ? void 0 : _a._ref) || !(item == null ? void 0 : item._key)) {
            return true;
          }
          const client = context.getClient({
            apiVersion: API_VERSION
          });
          const valueLanguage = await client.fetch("*[_id in [$ref, $draftRef]][0].".concat(languageField), {
            ref: item.value._ref,
            draftRef: "drafts.".concat(item.value._ref)
          });
          if (valueLanguage && valueLanguage === item._key) {
            return true;
          }
          return "Referenced document does not have the correct language value";
        }),
        options: {
          // TODO: Update type once it knows the values of this filter
          // @ts-expect-error
          filter: _ref8 => {
            let {
              parent,
              document
            } = _ref8;
            if (!parent) return null;
            const parentArray = Array.isArray(parent) ? parent : [parent];
            const language = parentArray.find(p => p._key);
            if (!(language == null ? void 0 : language._key)) return null;
            if (document.schemaTypes) {
              return {
                filter: "_type in $schemaTypes && ".concat(languageField, " == $language"),
                params: {
                  schemaTypes: document.schemaTypes,
                  language: language._key
                }
              };
            }
            return {
              filter: "".concat(languageField, " == $language"),
              params: {
                language: language._key
              }
            };
          }
        }
      }, {
        strict: false
      })]
    })]
  };
});
export { DeleteTranslationAction, DocumentInternationalizationMenu, documentInternationalization, useDocumentInternationalizationContext };
//# sourceMappingURL=index.esm.js.map
