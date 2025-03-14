import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { TrashIcon, CopyIcon, CogIcon, SplitVerticalIcon, CheckmarkIcon, AddIcon, EditIcon, TranslateIcon, InfoOutlineIcon } from "@sanity/icons";
import { Flex, Spinner, Stack, Text, Card, Grid, Button, useToast, Tooltip, Box, Badge, useClickOutside, TextInput, Popover, Inline, Dialog } from "@sanity/ui";
import { useMemo, useEffect, createContext, useContext, useState, useCallback } from "react";
import { useSchema, Preview, useClient, useWorkspace, defineLocaleResourceBundle, useDocumentStore, useDocumentOperation, useDocumentPairPermissions, DEFAULT_STUDIO_CLIENT_OPTIONS, useTranslation, useCurrentUser, InsufficientPermissionsMessage, isDocumentSchemaType, pathToString, useEditState, useValidationStatus, TextWithTone, PatchEvent, unset, defineType, defineField, definePlugin, isSanityDocument } from "sanity";
import { Feedback, useListeningQuery } from "sanity-plugin-utils";
import { uuid } from "@sanity/uuid";
import { useRouter, RouterContext } from "sanity/router";
import { structureLocaleNamespace, usePaneRouter, useDocumentPane } from "sanity/structure";
import { usePaneRouter as usePaneRouter$1 } from "sanity/desk";
import { Mutation, extractWithPath } from "@sanity/mutator";
import { styled } from "styled-components";
import { internationalizedArray } from "sanity-plugin-internationalized-array";
function DocumentPreview(props) {
  const schemaType = useSchema().get(props.type);
  return schemaType ? /* @__PURE__ */ jsx(Preview, { value: props.value, schemaType }) : /* @__PURE__ */ jsx(Feedback, { tone: "critical", title: "Schema type not found" });
}
const METADATA_SCHEMA_NAME = "translation.metadata", TRANSLATIONS_ARRAY_NAME = "translations", API_VERSION = "2023-05-22", DEFAULT_CONFIG = {
  supportedLanguages: [],
  schemaTypes: [],
  languageField: "language",
  weakReferences: !1,
  bulkPublish: !1,
  metadataFields: [],
  apiVersion: API_VERSION,
  allowCreateMetaDoc: !1,
  callback: null
};
function separateReferences(data = []) {
  const translations = [], otherReferences = [];
  return data && data.length > 0 && data.forEach((doc) => {
    doc._type === METADATA_SCHEMA_NAME ? translations.push(doc) : otherReferences.push(doc);
  }), { translations, otherReferences };
}
function DeleteTranslationDialog(props) {
  const { doc, documentId, setTranslations } = props, { data, loading } = useListeningQuery(
    "*[references($id)]{_id, _type}",
    { params: { id: documentId }, initialValue: [] }
  ), { translations, otherReferences } = useMemo(
    () => separateReferences(data),
    [data]
  );
  return useEffect(() => {
    setTranslations(translations);
  }, [setTranslations, translations]), loading ? /* @__PURE__ */ jsx(Flex, { padding: 4, align: "center", justify: "center", children: /* @__PURE__ */ jsx(Spinner, {}) }) : /* @__PURE__ */ jsxs(Stack, { space: 4, children: [
    translations && translations.length > 0 ? /* @__PURE__ */ jsx(Text, { children: "This document is a language-specific version which other translations depend on." }) : /* @__PURE__ */ jsx(Text, { children: "This document does not have connected translations." }),
    /* @__PURE__ */ jsx(Card, { border: !0, padding: 3, children: /* @__PURE__ */ jsxs(Stack, { space: 4, children: [
      /* @__PURE__ */ jsx(Text, { size: 1, weight: "semibold", children: translations && translations.length > 0 ? /* @__PURE__ */ jsx(Fragment, { children: "Before this document can be deleted" }) : /* @__PURE__ */ jsx(Fragment, { children: "This document can now be deleted" }) }),
      /* @__PURE__ */ jsx(DocumentPreview, { value: doc, type: doc._type }),
      translations && translations.length > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Card, { borderTop: !0 }),
        /* @__PURE__ */ jsxs(Text, { size: 1, weight: "semibold", children: [
          "The reference in",
          " ",
          translations.length === 1 ? "this translations document" : "these translations documents",
          " ",
          "must be removed"
        ] }),
        translations.map((translation) => /* @__PURE__ */ jsx(
          DocumentPreview,
          {
            value: translation,
            type: translation._type
          },
          translation._id
        ))
      ] }) : null,
      otherReferences && otherReferences.length > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Card, { borderTop: !0 }),
        /* @__PURE__ */ jsxs(Text, { size: 1, weight: "semibold", children: [
          otherReferences.length === 1 ? "There is an additional reference" : "There are additional references",
          " ",
          "to this document"
        ] }),
        otherReferences.map((reference) => /* @__PURE__ */ jsx(
          DocumentPreview,
          {
            value: reference,
            type: reference._type
          },
          reference._id
        ))
      ] }) : null
    ] }) }),
    otherReferences.length === 0 ? /* @__PURE__ */ jsx(Text, { children: "This document has no other references." }) : /* @__PURE__ */ jsx(Text, { children: "You may not be able to delete this document because other documents refer to it." })
  ] });
}
function DeleteTranslationFooter(props) {
  const { translations, onClose, onProceed } = props;
  return /* @__PURE__ */ jsxs(Grid, { columns: 2, gap: 2, children: [
    /* @__PURE__ */ jsx(Button, { text: "Cancel", onClick: onClose, mode: "ghost" }),
    /* @__PURE__ */ jsx(
      Button,
      {
        text: translations && translations.length > 0 ? "Unset translation reference" : "Delete document",
        onClick: onProceed,
        tone: "critical"
      }
    )
  ] });
}
const isPromise = (promise) => typeof promise == "object" && typeof promise.then == "function", globalCache = [];
function shallowEqualArrays(arrA, arrB, equal = (a, b) => a === b) {
  if (arrA === arrB)
    return !0;
  if (!arrA || !arrB)
    return !1;
  const len = arrA.length;
  if (arrB.length !== len)
    return !1;
  for (let i = 0; i < len; i++)
    if (!equal(arrA[i], arrB[i]))
      return !1;
  return !0;
}
function query$1(fn, keys = null, preload = !1, config2 = {}) {
  keys === null && (keys = [fn]);
  for (const entry2 of globalCache)
    if (shallowEqualArrays(keys, entry2.keys, entry2.equal)) {
      if (preload)
        return;
      if (Object.prototype.hasOwnProperty.call(entry2, "error"))
        throw entry2.error;
      if (Object.prototype.hasOwnProperty.call(entry2, "response"))
        return config2.lifespan && config2.lifespan > 0 && (entry2.timeout && clearTimeout(entry2.timeout), entry2.timeout = setTimeout(entry2.remove, config2.lifespan)), entry2.response;
      if (!preload)
        throw entry2.promise;
    }
  const entry = {
    keys,
    equal: config2.equal,
    remove: () => {
      const index = globalCache.indexOf(entry);
      index !== -1 && globalCache.splice(index, 1);
    },
    promise: (
      // Execute the promise
      (isPromise(fn) ? fn : fn(...keys)).then((response) => {
        entry.response = response, config2.lifespan && config2.lifespan > 0 && (entry.timeout = setTimeout(entry.remove, config2.lifespan));
      }).catch((error) => entry.error = error)
    )
  };
  if (globalCache.push(entry), !preload)
    throw entry.promise;
}
const suspend = (fn, keys, config2) => query$1(fn, keys, !1, config2);
var __defProp$3 = Object.defineProperty, __defProps$2 = Object.defineProperties, __getOwnPropDescs$2 = Object.getOwnPropertyDescriptors, __getOwnPropSymbols$3 = Object.getOwnPropertySymbols, __hasOwnProp$3 = Object.prototype.hasOwnProperty, __propIsEnum$3 = Object.prototype.propertyIsEnumerable, __defNormalProp$3 = (obj, key, value) => key in obj ? __defProp$3(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __spreadValues$3 = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp$3.call(b, prop) && __defNormalProp$3(a, prop, b[prop]);
  if (__getOwnPropSymbols$3)
    for (var prop of __getOwnPropSymbols$3(b))
      __propIsEnum$3.call(b, prop) && __defNormalProp$3(a, prop, b[prop]);
  return a;
}, __spreadProps$2 = (a, b) => __defProps$2(a, __getOwnPropDescs$2(b));
const DocumentInternationalizationContext = createContext(DEFAULT_CONFIG);
function useDocumentInternationalizationContext() {
  return useContext(DocumentInternationalizationContext);
}
function DocumentInternationalizationProvider(props) {
  const { pluginConfig } = props, client = useClient({ apiVersion: pluginConfig.apiVersion }), workspace = useWorkspace(), supportedLanguages = Array.isArray(pluginConfig.supportedLanguages) ? pluginConfig.supportedLanguages : (
    // eslint-disable-next-line require-await
    suspend(async () => typeof pluginConfig.supportedLanguages == "function" ? pluginConfig.supportedLanguages(client) : pluginConfig.supportedLanguages, [workspace])
  );
  return /* @__PURE__ */ jsx(
    DocumentInternationalizationContext.Provider,
    {
      value: __spreadProps$2(__spreadValues$3({}, pluginConfig), { supportedLanguages }),
      children: props.renderDefault(props)
    }
  );
}
const DeleteTranslationAction = (props) => {
  const { id: documentId, published, draft } = props, doc = draft || published, { languageField } = useDocumentInternationalizationContext(), [isDialogOpen, setDialogOpen] = useState(!1), [translations, setTranslations] = useState([]), onClose = useCallback(() => setDialogOpen(!1), []), documentLanguage = doc ? doc[languageField] : null, toast = useToast(), client = useClient({ apiVersion: API_VERSION }), onProceed = useCallback(() => {
    const tx = client.transaction();
    let operation = "DELETE";
    documentLanguage && translations.length > 0 ? (operation = "UNSET", translations.forEach((translation) => {
      tx.patch(
        translation._id,
        (patch) => patch.unset([
          `${TRANSLATIONS_ARRAY_NAME}[_key == "${documentLanguage}"]`
        ])
      );
    })) : (tx.delete(documentId), tx.delete(`drafts.${documentId}`)), tx.commit().then(() => {
      operation === "DELETE" && onClose(), toast.push({
        status: "success",
        title: operation === "UNSET" ? "Translation reference unset" : "Document deleted",
        description: operation === "UNSET" ? "The document can now be deleted" : null
      });
    }).catch((err) => {
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
      setDialogOpen(!0);
    },
    dialog: isDialogOpen && {
      type: "dialog",
      onClose,
      header: "Delete translation",
      content: doc ? /* @__PURE__ */ jsx(
        DeleteTranslationDialog,
        {
          doc,
          documentId,
          setTranslations
        }
      ) : null,
      footer: /* @__PURE__ */ jsx(
        DeleteTranslationFooter,
        {
          onClose,
          onProceed,
          translations
        }
      )
    }
  };
};
var extendStatics = function(d, b) {
  return extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
    d2.__proto__ = b2;
  } || function(d2, b2) {
    for (var p in b2)
      Object.prototype.hasOwnProperty.call(b2, p) && (d2[p] = b2[p]);
  }, extendStatics(d, b);
};
function __extends(d, b) {
  if (typeof b != "function" && b !== null)
    throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
function __values(o) {
  var s = typeof Symbol == "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m)
    return m.call(o);
  if (o && typeof o.length == "number")
    return {
      next: function() {
        return o && i >= o.length && (o = void 0), { value: o && o[i++], done: !o };
      }
    };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function __read(o, n) {
  var m = typeof Symbol == "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    for (; (n === void 0 || n-- > 0) && !(r = i.next()).done; )
      ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      r && !r.done && (m = i.return) && m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
}
function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2)
    for (var i = 0, l = from.length, ar; i < l; i++)
      (ar || !(i in from)) && (ar || (ar = Array.prototype.slice.call(from, 0, i)), ar[i] = from[i]);
  return to.concat(ar || Array.prototype.slice.call(from));
}
function isFunction(value) {
  return typeof value == "function";
}
function createErrorClass(createImpl) {
  var _super = function(instance) {
    Error.call(instance), instance.stack = new Error().stack;
  }, ctorFunc = createImpl(_super);
  return ctorFunc.prototype = Object.create(Error.prototype), ctorFunc.prototype.constructor = ctorFunc, ctorFunc;
}
var UnsubscriptionError = createErrorClass(function(_super) {
  return function(errors) {
    _super(this), this.message = errors ? errors.length + ` errors occurred during unsubscription:
` + errors.map(function(err, i) {
      return i + 1 + ") " + err.toString();
    }).join(`
  `) : "", this.name = "UnsubscriptionError", this.errors = errors;
  };
});
function arrRemove(arr, item) {
  if (arr) {
    var index = arr.indexOf(item);
    0 <= index && arr.splice(index, 1);
  }
}
var Subscription = function() {
  function Subscription2(initialTeardown) {
    this.initialTeardown = initialTeardown, this.closed = !1, this._parentage = null, this._finalizers = null;
  }
  return Subscription2.prototype.unsubscribe = function() {
    var e_1, _a, e_2, _b, errors;
    if (!this.closed) {
      this.closed = !0;
      var _parentage = this._parentage;
      if (_parentage)
        if (this._parentage = null, Array.isArray(_parentage))
          try {
            for (var _parentage_1 = __values(_parentage), _parentage_1_1 = _parentage_1.next(); !_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
              var parent_1 = _parentage_1_1.value;
              parent_1.remove(this);
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              _parentage_1_1 && !_parentage_1_1.done && (_a = _parentage_1.return) && _a.call(_parentage_1);
            } finally {
              if (e_1)
                throw e_1.error;
            }
          }
        else
          _parentage.remove(this);
      var initialFinalizer = this.initialTeardown;
      if (isFunction(initialFinalizer))
        try {
          initialFinalizer();
        } catch (e) {
          errors = e instanceof UnsubscriptionError ? e.errors : [e];
        }
      var _finalizers = this._finalizers;
      if (_finalizers) {
        this._finalizers = null;
        try {
          for (var _finalizers_1 = __values(_finalizers), _finalizers_1_1 = _finalizers_1.next(); !_finalizers_1_1.done; _finalizers_1_1 = _finalizers_1.next()) {
            var finalizer = _finalizers_1_1.value;
            try {
              execFinalizer(finalizer);
            } catch (err) {
              errors = errors != null ? errors : [], err instanceof UnsubscriptionError ? errors = __spreadArray(__spreadArray([], __read(errors)), __read(err.errors)) : errors.push(err);
            }
          }
        } catch (e_2_1) {
          e_2 = { error: e_2_1 };
        } finally {
          try {
            _finalizers_1_1 && !_finalizers_1_1.done && (_b = _finalizers_1.return) && _b.call(_finalizers_1);
          } finally {
            if (e_2)
              throw e_2.error;
          }
        }
      }
      if (errors)
        throw new UnsubscriptionError(errors);
    }
  }, Subscription2.prototype.add = function(teardown) {
    var _a;
    if (teardown && teardown !== this)
      if (this.closed)
        execFinalizer(teardown);
      else {
        if (teardown instanceof Subscription2) {
          if (teardown.closed || teardown._hasParent(this))
            return;
          teardown._addParent(this);
        }
        (this._finalizers = (_a = this._finalizers) !== null && _a !== void 0 ? _a : []).push(teardown);
      }
  }, Subscription2.prototype._hasParent = function(parent) {
    var _parentage = this._parentage;
    return _parentage === parent || Array.isArray(_parentage) && _parentage.includes(parent);
  }, Subscription2.prototype._addParent = function(parent) {
    var _parentage = this._parentage;
    this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
  }, Subscription2.prototype._removeParent = function(parent) {
    var _parentage = this._parentage;
    _parentage === parent ? this._parentage = null : Array.isArray(_parentage) && arrRemove(_parentage, parent);
  }, Subscription2.prototype.remove = function(teardown) {
    var _finalizers = this._finalizers;
    _finalizers && arrRemove(_finalizers, teardown), teardown instanceof Subscription2 && teardown._removeParent(this);
  }, Subscription2.EMPTY = function() {
    var empty = new Subscription2();
    return empty.closed = !0, empty;
  }(), Subscription2;
}();
function isSubscription(value) {
  return value instanceof Subscription || value && "closed" in value && isFunction(value.remove) && isFunction(value.add) && isFunction(value.unsubscribe);
}
function execFinalizer(finalizer) {
  isFunction(finalizer) ? finalizer() : finalizer.unsubscribe();
}
var config = {
  onUnhandledError: null,
  onStoppedNotification: null,
  Promise: void 0,
  useDeprecatedSynchronousErrorHandling: !1,
  useDeprecatedNextContext: !1
}, timeoutProvider = {
  setTimeout: function(handler, timeout) {
    for (var args = [], _i = 2; _i < arguments.length; _i++)
      args[_i - 2] = arguments[_i];
    return setTimeout.apply(void 0, __spreadArray([handler, timeout], __read(args)));
  },
  clearTimeout: function(handle) {
    return clearTimeout(handle);
  },
  delegate: void 0
};
function reportUnhandledError(err) {
  timeoutProvider.setTimeout(function() {
    throw err;
  });
}
function noop() {
}
var Subscriber = function(_super) {
  __extends(Subscriber2, _super);
  function Subscriber2(destination) {
    var _this = _super.call(this) || this;
    return _this.isStopped = !1, destination ? (_this.destination = destination, isSubscription(destination) && destination.add(_this)) : _this.destination = EMPTY_OBSERVER, _this;
  }
  return Subscriber2.create = function(next, error, complete) {
    return new SafeSubscriber(next, error, complete);
  }, Subscriber2.prototype.next = function(value) {
    this.isStopped || this._next(value);
  }, Subscriber2.prototype.error = function(err) {
    this.isStopped || (this.isStopped = !0, this._error(err));
  }, Subscriber2.prototype.complete = function() {
    this.isStopped || (this.isStopped = !0, this._complete());
  }, Subscriber2.prototype.unsubscribe = function() {
    this.closed || (this.isStopped = !0, _super.prototype.unsubscribe.call(this), this.destination = null);
  }, Subscriber2.prototype._next = function(value) {
    this.destination.next(value);
  }, Subscriber2.prototype._error = function(err) {
    try {
      this.destination.error(err);
    } finally {
      this.unsubscribe();
    }
  }, Subscriber2.prototype._complete = function() {
    try {
      this.destination.complete();
    } finally {
      this.unsubscribe();
    }
  }, Subscriber2;
}(Subscription), _bind = Function.prototype.bind;
function bind(fn, thisArg) {
  return _bind.call(fn, thisArg);
}
var ConsumerObserver = function() {
  function ConsumerObserver2(partialObserver) {
    this.partialObserver = partialObserver;
  }
  return ConsumerObserver2.prototype.next = function(value) {
    var partialObserver = this.partialObserver;
    if (partialObserver.next)
      try {
        partialObserver.next(value);
      } catch (error) {
        handleUnhandledError(error);
      }
  }, ConsumerObserver2.prototype.error = function(err) {
    var partialObserver = this.partialObserver;
    if (partialObserver.error)
      try {
        partialObserver.error(err);
      } catch (error) {
        handleUnhandledError(error);
      }
    else
      handleUnhandledError(err);
  }, ConsumerObserver2.prototype.complete = function() {
    var partialObserver = this.partialObserver;
    if (partialObserver.complete)
      try {
        partialObserver.complete();
      } catch (error) {
        handleUnhandledError(error);
      }
  }, ConsumerObserver2;
}(), SafeSubscriber = function(_super) {
  __extends(SafeSubscriber2, _super);
  function SafeSubscriber2(observerOrNext, error, complete) {
    var _this = _super.call(this) || this, partialObserver;
    if (isFunction(observerOrNext) || !observerOrNext)
      partialObserver = {
        next: observerOrNext != null ? observerOrNext : void 0,
        error: error != null ? error : void 0,
        complete: complete != null ? complete : void 0
      };
    else {
      var context_1;
      _this && config.useDeprecatedNextContext ? (context_1 = Object.create(observerOrNext), context_1.unsubscribe = function() {
        return _this.unsubscribe();
      }, partialObserver = {
        next: observerOrNext.next && bind(observerOrNext.next, context_1),
        error: observerOrNext.error && bind(observerOrNext.error, context_1),
        complete: observerOrNext.complete && bind(observerOrNext.complete, context_1)
      }) : partialObserver = observerOrNext;
    }
    return _this.destination = new ConsumerObserver(partialObserver), _this;
  }
  return SafeSubscriber2;
}(Subscriber);
function handleUnhandledError(error) {
  reportUnhandledError(error);
}
function defaultErrorHandler(err) {
  throw err;
}
var EMPTY_OBSERVER = {
  closed: !0,
  next: noop,
  error: defaultErrorHandler,
  complete: noop
};
function hasLift(source) {
  return isFunction(source == null ? void 0 : source.lift);
}
function operate(init) {
  return function(source) {
    if (hasLift(source))
      return source.lift(function(liftedSource) {
        try {
          return init(liftedSource, this);
        } catch (err) {
          this.error(err);
        }
      });
    throw new TypeError("Unable to lift unknown Observable type");
  };
}
function createOperatorSubscriber(destination, onNext, onComplete, onError, onFinalize) {
  return new OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize);
}
var OperatorSubscriber = function(_super) {
  __extends(OperatorSubscriber2, _super);
  function OperatorSubscriber2(destination, onNext, onComplete, onError, onFinalize, shouldUnsubscribe) {
    var _this = _super.call(this, destination) || this;
    return _this.onFinalize = onFinalize, _this.shouldUnsubscribe = shouldUnsubscribe, _this._next = onNext ? function(value) {
      try {
        onNext(value);
      } catch (err) {
        destination.error(err);
      }
    } : _super.prototype._next, _this._error = onError ? function(err) {
      try {
        onError(err);
      } catch (err2) {
        destination.error(err2);
      } finally {
        this.unsubscribe();
      }
    } : _super.prototype._error, _this._complete = onComplete ? function() {
      try {
        onComplete();
      } catch (err) {
        destination.error(err);
      } finally {
        this.unsubscribe();
      }
    } : _super.prototype._complete, _this;
  }
  return OperatorSubscriber2.prototype.unsubscribe = function() {
    var _a;
    if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
      var closed_1 = this.closed;
      _super.prototype.unsubscribe.call(this), !closed_1 && ((_a = this.onFinalize) === null || _a === void 0 || _a.call(this));
    }
  }, OperatorSubscriber2;
}(Subscriber), EmptyError = createErrorClass(function(_super) {
  return function() {
    _super(this), this.name = "EmptyError", this.message = "no elements in sequence";
  };
});
function firstValueFrom(source, config2) {
  return new Promise(function(resolve, reject) {
    var subscriber = new SafeSubscriber({
      next: function(value) {
        resolve(value), subscriber.unsubscribe();
      },
      error: reject,
      complete: function() {
        reject(new EmptyError());
      }
    });
    source.subscribe(subscriber);
  });
}
function filter(predicate, thisArg) {
  return operate(function(source, subscriber) {
    var index = 0;
    source.subscribe(createOperatorSubscriber(subscriber, function(value) {
      return predicate.call(thisArg, value, index++) && subscriber.next(value);
    }));
  });
}
const query = `*[_type == $translationSchema && $id in translations[].value._ref]{
  _id,
  _createdAt,
  translations
}`;
function useTranslationMetadata(id) {
  const { data, loading, error } = useListeningQuery(query, {
    params: { id, translationSchema: METADATA_SCHEMA_NAME }
  });
  return { data, loading, error };
}
const documenti18nLocaleNamespace = "document-internationalization", documentInternationalizationUsEnglishLocaleBundle = defineLocaleResourceBundle({
  locale: "en-US",
  namespace: documenti18nLocaleNamespace,
  resources: () => import("./_chunks-es/resources.mjs")
}), DISABLED_REASON_KEY = {
  METADATA_NOT_FOUND: "action.duplicate.disabled.missing-metadata",
  MULTIPLE_METADATA: "action.duplicate.disabled.multiple-metadata",
  NOTHING_TO_DUPLICATE: "action.duplicate.disabled.nothing-to-duplicate",
  NOT_READY: "action.duplicate.disabled.not-ready"
}, DuplicateWithTranslationsAction = ({
  id,
  type,
  onComplete
}) => {
  const documentStore = useDocumentStore(), { duplicate } = useDocumentOperation(id, type), { navigateIntent } = useRouter(), [isDuplicating, setDuplicating] = useState(!1), [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: "duplicate"
  }), { data, loading: isMetadataDocumentLoading } = useTranslationMetadata(id), hasOneMetadataDocument = useMemo(() => Array.isArray(data) && data.length <= 1, [data]), metadataDocument = Array.isArray(data) && data.length ? data[0] : null, client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS), toast = useToast(), { t: s } = useTranslation(structureLocaleNamespace), { t: d } = useTranslation(documenti18nLocaleNamespace), currentUser = useCurrentUser(), handle = useCallback(async () => {
    setDuplicating(!0);
    try {
      if (!metadataDocument)
        throw new Error("Metadata document not found");
      const translations = /* @__PURE__ */ new Map();
      await Promise.all(
        metadataDocument[TRANSLATIONS_ARRAY_NAME].map(async (translation) => {
          var _a;
          const dupeId2 = uuid(), locale = translation._key, docId = (_a = translation.value) == null ? void 0 : _a._ref;
          if (!docId)
            throw new Error("Translation document not found");
          const { duplicate: duplicateTranslation } = await firstValueFrom(
            documentStore.pair.editOperations(docId, type).pipe(filter((op) => op.duplicate.disabled !== "NOT_READY"))
          );
          if (duplicateTranslation.disabled)
            throw new Error("Cannot duplicate document");
          const duplicateTranslationSuccess = firstValueFrom(
            documentStore.pair.operationEvents(docId, type).pipe(filter((e) => e.op === "duplicate" && e.type === "success"))
          );
          duplicateTranslation.execute(dupeId2), await duplicateTranslationSuccess, translations.set(locale, dupeId2);
        })
      );
      const { duplicate: duplicateMetadata } = await firstValueFrom(
        documentStore.pair.editOperations(metadataDocument._id, METADATA_SCHEMA_NAME).pipe(filter((op) => op.duplicate.disabled !== "NOT_READY"))
      );
      if (duplicateMetadata.disabled)
        throw new Error("Cannot duplicate document");
      const duplicateMetadataSuccess = firstValueFrom(
        documentStore.pair.operationEvents(metadataDocument._id, METADATA_SCHEMA_NAME).pipe(filter((e) => e.op === "duplicate" && e.type === "success"))
      ), dupeId = uuid();
      duplicateMetadata.execute(dupeId), await duplicateMetadataSuccess;
      const patch = {
        set: Object.fromEntries(
          Array.from(translations.entries()).map(([locale, documentId]) => [
            `${TRANSLATIONS_ARRAY_NAME}[_key == "${locale}"].value._ref`,
            documentId
          ])
        )
      };
      await client.transaction().patch(dupeId, patch).commit(), navigateIntent("edit", {
        id: Array.from(translations.values()).at(0),
        type
      }), onComplete();
    } catch (error) {
      console.error(error), toast.push({
        status: "error",
        title: "Error duplicating document",
        description: error instanceof Error ? error.message : "Failed to duplicate document"
      });
    } finally {
      setDuplicating(!1);
    }
  }, [
    client,
    documentStore.pair,
    metadataDocument,
    navigateIntent,
    onComplete,
    toast,
    type
  ]);
  return useMemo(() => !isPermissionsLoading && !(permissions != null && permissions.granted) ? {
    icon: CopyIcon,
    disabled: !0,
    label: d("action.duplicate.label"),
    title: /* @__PURE__ */ jsx(
      InsufficientPermissionsMessage,
      {
        context: "duplicate-document",
        currentUser
      }
    )
  } : !isMetadataDocumentLoading && !metadataDocument ? {
    icon: CopyIcon,
    disabled: !0,
    label: d("action.duplicate.label"),
    title: d(DISABLED_REASON_KEY.METADATA_NOT_FOUND)
  } : hasOneMetadataDocument ? {
    icon: CopyIcon,
    disabled: isDuplicating || !!duplicate.disabled || isPermissionsLoading || isMetadataDocumentLoading,
    label: isDuplicating ? s("action.duplicate.running.label") : d("action.duplicate.label"),
    title: duplicate.disabled ? s(DISABLED_REASON_KEY[duplicate.disabled]) : "",
    onHandle: handle
  } : {
    icon: CopyIcon,
    disabled: !0,
    label: d("action.duplicate.label"),
    title: d(DISABLED_REASON_KEY.MULTIPLE_METADATA)
  }, [
    currentUser,
    duplicate.disabled,
    handle,
    hasOneMetadataDocument,
    isDuplicating,
    isMetadataDocumentLoading,
    isPermissionsLoading,
    metadataDocument,
    permissions == null ? void 0 : permissions.granted,
    s,
    d
  ]);
};
DuplicateWithTranslationsAction.action = "duplicate";
DuplicateWithTranslationsAction.displayName = "DuplicateWithTranslationsAction";
function useOpenInNewPane(id, type) {
  const routerContext = useContext(RouterContext), { routerPanesState, groupIndex } = usePaneRouter();
  return useCallback(() => {
    if (!routerContext || !id || !type)
      return;
    if (!routerPanesState.length) {
      routerContext.navigateIntent("edit", { id, type });
      return;
    }
    const panes = [...routerPanesState];
    panes.splice(groupIndex + 1, 0, [
      {
        id,
        params: { type }
      }
    ]);
    const href = routerContext.resolvePathFromState({ panes });
    routerContext.navigateUrl({ path: href });
  }, [id, type, routerContext, routerPanesState, groupIndex]);
}
var __defProp$2 = Object.defineProperty, __getOwnPropSymbols$2 = Object.getOwnPropertySymbols, __hasOwnProp$2 = Object.prototype.hasOwnProperty, __propIsEnum$2 = Object.prototype.propertyIsEnumerable, __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __spreadValues$2 = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp$2.call(b, prop) && __defNormalProp$2(a, prop, b[prop]);
  if (__getOwnPropSymbols$2)
    for (var prop of __getOwnPropSymbols$2(b))
      __propIsEnum$2.call(b, prop) && __defNormalProp$2(a, prop, b[prop]);
  return a;
};
function createReference(key, ref, type, strengthenOnPublish = !0) {
  return {
    _key: key,
    _type: "internationalizedArrayReferenceValue",
    value: __spreadValues$2({
      _type: "reference",
      _ref: ref,
      _weak: !0
    }, strengthenOnPublish ? { _strengthenOnPublish: { type } } : {})
  };
}
function LanguageManage(props) {
  const { id, metadataId, schemaType, documentId, sourceLanguageId } = props, open = useOpenInNewPane(id, METADATA_SCHEMA_NAME), openCreated = useOpenInNewPane(metadataId, METADATA_SCHEMA_NAME), { allowCreateMetaDoc, apiVersion, weakReferences } = useDocumentInternationalizationContext(), client = useClient({ apiVersion }), [userHasClicked, setUserHasClicked] = useState(!1), canCreate = !id && !!metadataId && allowCreateMetaDoc, handleClick = useCallback(() => {
    if (!id && metadataId && sourceLanguageId) {
      setUserHasClicked(!0);
      const transaction = client.transaction(), sourceReference = createReference(
        sourceLanguageId,
        documentId,
        schemaType.name,
        !weakReferences
      ), newMetadataDocument = {
        _id: metadataId,
        _type: METADATA_SCHEMA_NAME,
        schemaTypes: [schemaType.name],
        translations: [sourceReference]
      };
      transaction.createIfNotExists(newMetadataDocument), transaction.commit().then(() => {
        setUserHasClicked(!1), openCreated();
      }).catch((err) => {
        console.error(err), setUserHasClicked(!1);
      });
    } else
      open();
  }, [
    id,
    metadataId,
    sourceLanguageId,
    client,
    documentId,
    schemaType.name,
    weakReferences,
    openCreated,
    open
  ]);
  return /* @__PURE__ */ jsx(
    Tooltip,
    {
      animate: !0,
      content: /* @__PURE__ */ jsx(Box, { padding: 2, children: /* @__PURE__ */ jsx(Text, { muted: !0, size: 1, children: "Document has no other translations" }) }),
      fallbackPlacements: ["right", "left"],
      placement: "top",
      portal: !0,
      disabled: !!id || canCreate,
      children: /* @__PURE__ */ jsx(Stack, { children: /* @__PURE__ */ jsx(
        Button,
        {
          disabled: !id && !canCreate || canCreate && !sourceLanguageId || userHasClicked,
          mode: "ghost",
          text: "Manage Translations",
          icon: CogIcon,
          loading: userHasClicked,
          onClick: handleClick
        }
      ) })
    }
  );
}
function useOpenInCurrentPane(id, type) {
  const routerContext = useContext(RouterContext), { routerPanesState, groupIndex } = usePaneRouter$1();
  return useCallback(() => {
    if (!routerContext || !id || !type)
      return;
    if (!routerPanesState.length) {
      routerContext.navigateIntent("edit", { id, type });
      return;
    }
    const panes = [...routerPanesState];
    panes.splice(groupIndex, 1, [
      {
        id,
        params: { type }
      }
    ]);
    const href = routerContext.resolvePathFromState({ panes });
    routerContext.navigateUrl({ path: href });
  }, [id, type, routerContext, routerPanesState, groupIndex]);
}
function removeExcludedPaths(doc, schemaType) {
  if (!isDocumentSchemaType(schemaType) || !doc)
    return doc;
  const pathsToExclude = extractPaths(doc, schemaType, []).filter(
    (field) => {
      var _a, _b, _c;
      return ((_c = (_b = (_a = field.schemaType) == null ? void 0 : _a.options) == null ? void 0 : _b.documentInternationalization) == null ? void 0 : _c.exclude) === !0;
    }
  ).map((field) => pathToString(field.path));
  return new Mutation({
    mutations: [
      {
        patch: {
          id: doc._id,
          unset: pathsToExclude
        }
      }
    ]
  }).apply(doc);
}
function extractPaths(doc, schemaType, path) {
  return schemaType.fields.reduce((acc, field) => {
    var _a, _b;
    const fieldPath = [...path, field.name], fieldSchema = field.type, { value } = (_a = extractWithPath(pathToString(fieldPath), doc)[0]) != null ? _a : {};
    if (!value)
      return acc;
    const thisFieldWithPath = {
      path: fieldPath,
      name: field.name,
      schemaType: fieldSchema,
      value
    };
    if (fieldSchema.jsonType === "object") {
      const innerFields = extractPaths(doc, fieldSchema, fieldPath);
      return [...acc, thisFieldWithPath, ...innerFields];
    } else if (fieldSchema.jsonType === "array" && fieldSchema.of.length && fieldSchema.of.some((item) => "fields" in item)) {
      const { value: arrayValue } = (_b = extractWithPath(pathToString(fieldPath), doc)[0]) != null ? _b : {};
      let arrayPaths = [];
      if (arrayValue != null && arrayValue.length)
        for (const item of arrayValue) {
          const itemPath = [...fieldPath, { _key: item._key }];
          let itemSchema = fieldSchema.of.find((t) => t.name === item._type);
          if (item._type || (itemSchema = fieldSchema.of[0]), item._key && itemSchema) {
            const innerFields = extractPaths(
              doc,
              itemSchema,
              itemPath
            ), arrayMember = {
              path: itemPath,
              name: item._key,
              schemaType: itemSchema,
              value: item
            };
            arrayPaths = [...arrayPaths, arrayMember, ...innerFields];
          }
        }
      return [...acc, thisFieldWithPath, ...arrayPaths];
    }
    return [...acc, thisFieldWithPath];
  }, []);
}
var __defProp$1 = Object.defineProperty, __defProps$1 = Object.defineProperties, __getOwnPropDescs$1 = Object.getOwnPropertyDescriptors, __getOwnPropSymbols$1 = Object.getOwnPropertySymbols, __hasOwnProp$1 = Object.prototype.hasOwnProperty, __propIsEnum$1 = Object.prototype.propertyIsEnumerable, __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __spreadValues$1 = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp$1.call(b, prop) && __defNormalProp$1(a, prop, b[prop]);
  if (__getOwnPropSymbols$1)
    for (var prop of __getOwnPropSymbols$1(b))
      __propIsEnum$1.call(b, prop) && __defNormalProp$1(a, prop, b[prop]);
  return a;
}, __spreadProps$1 = (a, b) => __defProps$1(a, __getOwnPropDescs$1(b));
function LanguageOption(props) {
  var _a;
  const {
    language,
    schemaType,
    documentId,
    current,
    source,
    sourceLanguageId,
    metadata: metadata2,
    metadataId
  } = props, [userHasClicked, setUserHasClicked] = useState(!1), disabled = props.disabled || userHasClicked || current || !source || !sourceLanguageId || !metadataId, translation = metadata2 != null && metadata2.translations.length ? metadata2.translations.find((t) => t._key === language.id) : void 0, { apiVersion, languageField, weakReferences, callback } = useDocumentInternationalizationContext(), client = useClient({ apiVersion }), toast = useToast(), open = useOpenInCurrentPane((_a = translation == null ? void 0 : translation.value) == null ? void 0 : _a._ref, schemaType), handleOpen = useCallback(() => open(), [open]);
  useEffect(() => {
    setUserHasClicked(!1);
  }, [!!translation]);
  const handleCreate = useCallback(async () => {
    if (!source)
      throw new Error("Cannot create translation without source document");
    if (!sourceLanguageId)
      throw new Error("Cannot create translation without source language ID");
    if (!metadataId)
      throw new Error("Cannot create translation without a metadata ID");
    setUserHasClicked(!0);
    const transaction = client.transaction(), newTranslationDocumentId = uuid();
    let newTranslationDocument = __spreadProps$1(__spreadValues$1({}, source), {
      _id: `drafts.${newTranslationDocumentId}`,
      // 2. Update language of the translation
      [languageField]: language.id
    });
    newTranslationDocument = removeExcludedPaths(
      newTranslationDocument,
      schemaType
    ), transaction.create(newTranslationDocument);
    const sourceReference = createReference(
      sourceLanguageId,
      documentId,
      schemaType.name,
      !weakReferences
    ), newTranslationReference = createReference(
      language.id,
      newTranslationDocumentId,
      schemaType.name,
      !weakReferences
    ), newMetadataDocument = {
      _id: metadataId,
      _type: METADATA_SCHEMA_NAME,
      schemaTypes: [schemaType.name],
      translations: [sourceReference]
    };
    transaction.createIfNotExists(newMetadataDocument);
    const metadataPatch = client.patch(metadataId).setIfMissing({ translations: [sourceReference] }).insert("after", "translations[-1]", [newTranslationReference]);
    transaction.patch(metadataPatch), transaction.commit().then(() => {
      const metadataExisted = !!(metadata2 != null && metadata2._createdAt);
      return callback == null || callback({
        client,
        sourceLanguageId,
        sourceDocument: source,
        newDocument: newTranslationDocument,
        destinationLanguageId: language.id,
        metaDocumentId: metadataId
      }).catch((err) => {
        toast.push({
          status: "error",
          title: "Callback",
          description: `Error while running callback - ${err}.`
        });
      }), toast.push({
        status: "success",
        title: `Created "${language.title}" translation`,
        description: metadataExisted ? "Updated Translations Metadata" : "Created Translations Metadata"
      });
    }).catch((err) => (console.error(err), setUserHasClicked(!1), toast.push({
      status: "error",
      title: "Error creating translation",
      description: err.message
    })));
  }, [
    client,
    documentId,
    language.id,
    language.title,
    languageField,
    metadata2 == null ? void 0 : metadata2._createdAt,
    metadataId,
    schemaType,
    source,
    sourceLanguageId,
    toast,
    weakReferences,
    callback
  ]);
  let message;
  return current ? message = "Current document" : translation ? message = `Open ${language.title} translation` : translation || (message = `Create new ${language.title} translation`), /* @__PURE__ */ jsx(
    Tooltip,
    {
      animate: !0,
      content: /* @__PURE__ */ jsx(Box, { padding: 2, children: /* @__PURE__ */ jsx(Text, { muted: !0, size: 1, children: message }) }),
      fallbackPlacements: ["right", "left"],
      placement: "top",
      portal: !0,
      children: /* @__PURE__ */ jsx(
        Button,
        {
          onClick: translation ? handleOpen : handleCreate,
          mode: current && disabled ? "default" : "bleed",
          disabled,
          children: /* @__PURE__ */ jsxs(Flex, { gap: 3, align: "center", children: [
            disabled && !current ? /* @__PURE__ */ jsx(Spinner, {}) : /* @__PURE__ */ jsx(Text, { size: 2, children: translation ? /* @__PURE__ */ jsx(SplitVerticalIcon, {}) : current ? /* @__PURE__ */ jsx(CheckmarkIcon, {}) : /* @__PURE__ */ jsx(AddIcon, {}) }),
            /* @__PURE__ */ jsx(Box, { flex: 1, children: /* @__PURE__ */ jsx(Text, { children: language.title }) }),
            /* @__PURE__ */ jsx(Badge, { tone: disabled || current ? "default" : "primary", children: language.id })
          ] })
        }
      )
    }
  );
}
function LanguagePatch(props) {
  const { language, source } = props, { apiVersion, languageField } = useDocumentInternationalizationContext(), disabled = props.disabled || !source, client = useClient({ apiVersion }), toast = useToast(), handleClick = useCallback(() => {
    if (!source)
      throw new Error("Cannot patch missing document");
    const currentId = source._id;
    client.patch(currentId).set({ [languageField]: language.id }).commit().then(() => {
      toast.push({
        title: `Set document language to ${language.title}`,
        status: "success"
      });
    }).catch((err) => (console.error(err), toast.push({
      title: `Failed to set document language to ${language.title}`,
      status: "error"
    })));
  }, [source, client, languageField, language, toast]);
  return /* @__PURE__ */ jsx(
    Button,
    {
      mode: "bleed",
      onClick: handleClick,
      disabled,
      justify: "flex-start",
      children: /* @__PURE__ */ jsxs(Flex, { gap: 3, align: "center", children: [
        /* @__PURE__ */ jsx(Text, { size: 2, children: /* @__PURE__ */ jsx(EditIcon, {}) }),
        /* @__PURE__ */ jsx(Box, { flex: 1, children: /* @__PURE__ */ jsx(Text, { children: language.title }) }),
        /* @__PURE__ */ jsx(Badge, { children: language.id })
      ] })
    }
  );
}
var ConstrainedBox = styled(Box)`
  max-width: 280px;
`;
function Warning({ children }) {
  return /* @__PURE__ */ jsx(Card, { tone: "caution", padding: 3, children: /* @__PURE__ */ jsx(Flex, { justify: "center", children: /* @__PURE__ */ jsx(ConstrainedBox, { children: /* @__PURE__ */ jsx(Text, { size: 1, align: "center", children }) }) }) });
}
function DocumentInternationalizationMenu(props) {
  const { documentId } = props, schemaType = props.schemaType, { languageField, supportedLanguages } = useDocumentInternationalizationContext(), [query2, setQuery] = useState(""), handleQuery = useCallback((event) => {
    event.currentTarget.value ? setQuery(event.currentTarget.value) : setQuery("");
  }, []), [open, setOpen] = useState(!1), handleClick = useCallback(() => setOpen((o) => !o), []), [button, setButton] = useState(null), [popover, setPopover] = useState(null), handleClickOutside = useCallback(() => setOpen(!1), []);
  useClickOutside(handleClickOutside, [button, popover]);
  const { data, loading, error } = useTranslationMetadata(documentId), metadata2 = Array.isArray(data) && data.length ? data[0] : null, metadataId = useMemo(() => {
    var _a;
    return loading ? null : (_a = metadata2 == null ? void 0 : metadata2._id) != null ? _a : uuid();
  }, [loading, metadata2 == null ? void 0 : metadata2._id]), { draft, published } = useEditState(documentId, schemaType.name), source = draft || published, documentIsInOneMetadataDocument = useMemo(() => Array.isArray(data) && data.length <= 1, [data]), sourceLanguageId = source == null ? void 0 : source[languageField], sourceLanguageIsValid = supportedLanguages.some(
    (l) => l.id === sourceLanguageId
  ), allLanguagesAreValid = useMemo(() => {
    const valid = supportedLanguages.every((l) => l.id && l.title);
    return valid || console.warn(
      'Not all languages are valid. It should be an array of objects with an "id" and "title" property. Or a function that returns an array of objects with an "id" and "title" property.',
      supportedLanguages
    ), valid;
  }, [supportedLanguages]), content = /* @__PURE__ */ jsx(Box, { padding: 1, children: error ? /* @__PURE__ */ jsx(Card, { tone: "critical", padding: 1, children: /* @__PURE__ */ jsx(Text, { children: "There was an error returning translations metadata" }) }) : /* @__PURE__ */ jsxs(Stack, { space: 1, children: [
    /* @__PURE__ */ jsx(
      LanguageManage,
      {
        id: metadata2 == null ? void 0 : metadata2._id,
        documentId,
        metadataId,
        schemaType,
        sourceLanguageId
      }
    ),
    supportedLanguages.length > 4 ? /* @__PURE__ */ jsx(
      TextInput,
      {
        onChange: handleQuery,
        value: query2,
        placeholder: "Filter languages"
      }
    ) : null,
    supportedLanguages.length > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
      loading ? null : /* @__PURE__ */ jsxs(Fragment, { children: [
        data && documentIsInOneMetadataDocument ? null : /* @__PURE__ */ jsx(Warning, { children: "This document has been found in more than one Translations Metadata documents" }),
        allLanguagesAreValid ? null : /* @__PURE__ */ jsx(Warning, { children: "Not all language objects are valid. See the console." }),
        sourceLanguageId ? null : /* @__PURE__ */ jsxs(Warning, { children: [
          "Choose a language to apply to",
          " ",
          /* @__PURE__ */ jsx("strong", { children: "this Document" })
        ] }),
        sourceLanguageId && !sourceLanguageIsValid ? /* @__PURE__ */ jsxs(Warning, { children: [
          "Select a supported language. Current language value:",
          " ",
          /* @__PURE__ */ jsx("code", { children: sourceLanguageId })
        ] }) : null
      ] }),
      supportedLanguages.filter((language) => query2 ? language.title.toLowerCase().includes(query2.toLowerCase()) : !0).map(
        (language) => {
          var _a;
          return !loading && sourceLanguageId && sourceLanguageIsValid ? (
            // Button to duplicate this document to a new translation
            // And either create or update the metadata document
            /* @__PURE__ */ jsx(
              LanguageOption,
              {
                language,
                schemaType,
                documentId,
                disabled: loading || !allLanguagesAreValid,
                current: language.id === sourceLanguageId,
                metadata: metadata2,
                metadataId,
                source,
                sourceLanguageId
              },
              language.id
            )
          ) : (
            // Button to set a language field on *this* document
            /* @__PURE__ */ jsx(
              LanguagePatch,
              {
                source,
                language,
                disabled: (_a = loading || !allLanguagesAreValid || (metadata2 == null ? void 0 : metadata2.translations.filter((t) => {
                  var _a2;
                  return ((_a2 = t == null ? void 0 : t.value) == null ? void 0 : _a2._ref) !== documentId;
                }).some((t) => t._key === language.id))) != null ? _a : !1
              },
              language.id
            )
          );
        }
      )
    ] }) : null
  ] }) }), issueWithTranslations = !loading && sourceLanguageId && !sourceLanguageIsValid;
  return !documentId || !schemaType || !schemaType.name ? null : /* @__PURE__ */ jsx(
    Popover,
    {
      animate: !0,
      constrainSize: !0,
      content,
      open,
      portal: !0,
      ref: setPopover,
      overflow: "auto",
      tone: "default",
      children: /* @__PURE__ */ jsx(
        Button,
        {
          text: "Translations",
          mode: "bleed",
          disabled: !source,
          tone: !source || loading || !issueWithTranslations ? void 0 : "caution",
          icon: TranslateIcon,
          onClick: handleClick,
          ref: setButton,
          selected: open
        }
      )
    }
  );
}
const DeleteMetadataAction = (props) => {
  const { id: documentId, published, draft, onComplete } = props, doc = draft || published, [isDialogOpen, setDialogOpen] = useState(!1), onClose = useCallback(() => setDialogOpen(!1), []), translations = useMemo(
    () => doc && Array.isArray(doc[TRANSLATIONS_ARRAY_NAME]) ? doc[TRANSLATIONS_ARRAY_NAME] : [],
    [doc]
  ), toast = useToast(), client = useClient({ apiVersion: API_VERSION }), onProceed = useCallback(() => {
    const tx = client.transaction();
    tx.patch(documentId, (patch) => patch.unset([TRANSLATIONS_ARRAY_NAME])), translations.length > 0 && translations.forEach((translation) => {
      tx.delete(translation.value._ref), tx.delete(`drafts.${translation.value._ref}`);
    }), tx.delete(documentId), tx.delete(`drafts.${documentId}`), tx.commit().then(() => {
      onClose(), toast.push({
        status: "success",
        title: "Deleted document and translations"
      });
    }).catch((err) => {
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
      setDialogOpen(!0);
    },
    dialog: isDialogOpen && {
      type: "confirm",
      onCancel: onComplete,
      onConfirm: () => {
        onProceed(), onComplete();
      },
      tone: "critical",
      message: translations.length === 1 ? "Delete 1 translation and this document" : `Delete all ${translations.length} translations and this document`
    }
  };
};
function LanguageBadge(props) {
  var _a, _b;
  const source = (props == null ? void 0 : props.draft) || (props == null ? void 0 : props.published), { languageField, supportedLanguages } = useDocumentInternationalizationContext(), languageId = source == null ? void 0 : source[languageField];
  if (!languageId)
    return null;
  const language = Array.isArray(supportedLanguages) ? supportedLanguages.find((l) => l.id === languageId) : null;
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
  } = props, editState = useEditState(id, ""), { isValidating, validation } = useValidationStatus(id, ""), schema = useSchema(), validationHasErrors = useMemo(() => !isValidating && validation.length > 0 && validation.some((item) => item.level === "error"), [isValidating, validation]);
  if (useEffect(() => {
    validationHasErrors ? addInvalidId(id) : removeInvalidId(id), editState.draft ? addDraftId(id) : removeDraftId(id), isValidating || onCheckComplete(id);
  }, [
    addDraftId,
    addInvalidId,
    editState.draft,
    id,
    isValidating,
    onCheckComplete,
    removeDraftId,
    removeInvalidId,
    validationHasErrors
  ]), !editState.draft)
    return null;
  const schemaType = schema.get(editState.draft._type);
  return /* @__PURE__ */ jsx(
    Card,
    {
      border: !0,
      padding: 2,
      tone: validationHasErrors ? "critical" : "positive",
      children: editState.draft && schemaType ? /* @__PURE__ */ jsx(
        Preview,
        {
          layout: "default",
          value: editState.draft,
          schemaType
        }
      ) : /* @__PURE__ */ jsx(Spinner, {})
    }
  );
}
function InfoIcon(props) {
  const { text, icon, tone, children } = props;
  return /* @__PURE__ */ jsx(
    Tooltip,
    {
      animate: !0,
      portal: !0,
      content: children ? /* @__PURE__ */ jsx(Fragment, { children }) : /* @__PURE__ */ jsx(Box, { padding: 2, children: /* @__PURE__ */ jsx(Text, { size: 1, children: text }) }),
      children: /* @__PURE__ */ jsx(TextWithTone, { tone, size: 1, children: /* @__PURE__ */ jsx(icon, {}) })
    }
  );
}
function Info() {
  return /* @__PURE__ */ jsx(InfoIcon, { icon: InfoOutlineIcon, tone: "primary", children: /* @__PURE__ */ jsxs(Stack, { padding: 3, space: 4, style: { maxWidth: 250 }, children: [
    /* @__PURE__ */ jsx(Box, { children: /* @__PURE__ */ jsx(Text, { size: 1, children: "Bulk publishing uses the Scheduling API." }) }),
    /* @__PURE__ */ jsx(Box, { children: /* @__PURE__ */ jsx(Text, { size: 1, children: "Customized Document Actions in the Studio will not execute. Webhooks will execute." }) }),
    /* @__PURE__ */ jsx(Box, { children: /* @__PURE__ */ jsx(Text, { size: 1, children: "Validation is checked before rendering the button below, but the Scheduling API will not check for \u2013 or enforce \u2013 validation." }) })
  ] }) });
}
function BulkPublish(props) {
  const { translations } = props, client = useClient({ apiVersion: API_VERSION }), { projectId, dataset } = useWorkspace(), toast = useToast(), [invalidIds, setInvalidIds] = useState(null), [checkedIds, setCheckedIds] = useState([]), onCheckComplete = useCallback((id) => {
    setCheckedIds((ids) => Array.from(/* @__PURE__ */ new Set([...ids, id])));
  }, []), [open, setOpen] = useState(!1), onOpen = useCallback(() => setOpen(!0), []), onClose = useCallback(() => setOpen(!1), []), addInvalidId = useCallback((id) => {
    setInvalidIds((ids) => ids ? Array.from(/* @__PURE__ */ new Set([...ids, id])) : [id]);
  }, []), removeInvalidId = useCallback((id) => {
    setInvalidIds((ids) => ids ? ids.filter((i) => i !== id) : []);
  }, []), [draftIds, setDraftIds] = useState([]), addDraftId = useCallback((id) => {
    setDraftIds((ids) => Array.from(/* @__PURE__ */ new Set([...ids, id])));
  }, []), removeDraftId = useCallback((id) => {
    setDraftIds((ids) => ids.filter((i) => i !== id));
  }, []), handleBulkPublish = useCallback(() => {
    const body = translations.map((translation) => ({
      documentId: translation.value._ref
    }));
    client.request({
      uri: `/publish/${projectId}/${dataset}`,
      method: "POST",
      body
    }).then(() => {
      toast.push({
        status: "success",
        title: "Success",
        description: "Bulk publish complete"
      });
    }).catch((err) => {
      console.error(err), toast.push({
        status: "error",
        title: "Error",
        description: "Bulk publish failed"
      });
    });
  }, [translations, client, projectId, dataset, toast]), disabled = (
    // Not all documents have been checked
    checkedIds.length !== translations.length || // Some document(s) are invalid
    !!(invalidIds && (invalidIds == null ? void 0 : invalidIds.length) > 0) || // No documents are drafts
    !draftIds.length
  );
  return (translations == null ? void 0 : translations.length) > 0 ? /* @__PURE__ */ jsx(Card, { padding: 4, border: !0, radius: 2, children: /* @__PURE__ */ jsxs(Stack, { space: 3, children: [
    /* @__PURE__ */ jsxs(Inline, { space: 3, children: [
      /* @__PURE__ */ jsx(Text, { weight: "bold", size: 1, children: "Bulk publishing" }),
      /* @__PURE__ */ jsx(Info, {})
    ] }),
    /* @__PURE__ */ jsx(Stack, { children: /* @__PURE__ */ jsx(
      Button,
      {
        onClick: onOpen,
        text: "Prepare bulk publishing",
        mode: "ghost"
      }
    ) }),
    open && /* @__PURE__ */ jsx(
      Dialog,
      {
        animate: !0,
        header: "Bulk publishing",
        id: "bulk-publish-dialog",
        onClose,
        zOffset: 1e3,
        width: 3,
        children: /* @__PURE__ */ jsxs(Stack, { space: 4, padding: 4, children: [
          draftIds.length > 0 ? /* @__PURE__ */ jsxs(Stack, { space: 2, children: [
            /* @__PURE__ */ jsxs(Text, { size: 1, children: [
              "There",
              " ",
              draftIds.length === 1 ? "is 1 draft document" : `are ${draftIds.length} draft documents`,
              "."
            ] }),
            invalidIds && invalidIds.length > 0 ? /* @__PURE__ */ jsxs(TextWithTone, { tone: "critical", size: 1, children: [
              invalidIds && invalidIds.length === 1 ? "1 draft document has" : `${invalidIds && invalidIds.length} draft documents have`,
              " ",
              "validation issues that must addressed first"
            ] }) : /* @__PURE__ */ jsx(TextWithTone, { tone: "positive", size: 1, children: "All drafts are valid and can be bulk published" })
          ] }) : null,
          /* @__PURE__ */ jsx(Stack, { space: 1, children: translations.filter((translation) => {
            var _a;
            return (_a = translation == null ? void 0 : translation.value) == null ? void 0 : _a._ref;
          }).map((translation) => /* @__PURE__ */ jsx(
            DocumentCheck,
            {
              id: translation.value._ref,
              onCheckComplete,
              addInvalidId,
              removeInvalidId,
              addDraftId,
              removeDraftId
            },
            translation._key
          )) }),
          draftIds.length > 0 ? /* @__PURE__ */ jsx(
            Button,
            {
              mode: "ghost",
              tone: invalidIds && (invalidIds == null ? void 0 : invalidIds.length) > 0 ? "caution" : "positive",
              text: draftIds.length === 1 ? "Publish draft document" : `Bulk publish ${draftIds.length} draft documents`,
              onClick: handleBulkPublish,
              disabled
            }
          ) : /* @__PURE__ */ jsx(Text, { muted: !0, size: 1, children: "No draft documents to publish" })
        ] })
      }
    )
  ] }) }) : null;
}
function ReferencePatcher(props) {
  const { translation, documentType, metadataId } = props, editState = useEditState(translation.value._ref, documentType), client = useClient({ apiVersion: API_VERSION }), { onChange } = useDocumentPane();
  return useEffect(() => {
    if (
      // We have a reference
      translation.value._ref && // It's still weak and not-yet-strengthened
      translation.value._weak && // We also want to keep this check because maybe the user *configured* weak refs
      translation.value._strengthenOnPublish && // The referenced document has just been published
      !editState.draft && editState.published && editState.ready
    ) {
      const referencePathBase = [
        "translations",
        { _key: translation._key },
        "value"
      ];
      onChange(
        new PatchEvent([
          unset([...referencePathBase, "_weak"]),
          unset([...referencePathBase, "_strengthenOnPublish"])
        ])
      );
    }
  }, [translation, editState, metadataId, client, onChange]), null;
}
function OptimisticallyStrengthen(props) {
  const { translations = [], metadataId } = props;
  return translations.length ? /* @__PURE__ */ jsx(Fragment, { children: translations.map(
    (translation) => {
      var _a;
      return (_a = translation.value._strengthenOnPublish) != null && _a.type ? /* @__PURE__ */ jsx(
        ReferencePatcher,
        {
          translation,
          documentType: translation.value._strengthenOnPublish.type,
          metadataId
        },
        translation._key
      ) : null;
    }
  ) }) : null;
}
var metadata = (schemaTypes, metadataFields) => defineType({
  type: "document",
  name: METADATA_SCHEMA_NAME,
  title: "Translation metadata",
  icon: TranslateIcon,
  liveEdit: !0,
  fields: [
    defineField({
      name: TRANSLATIONS_ARRAY_NAME,
      type: "internationalizedArrayReference"
    }),
    defineField({
      name: "schemaTypes",
      description: "Optional: Used to filter the reference fields above so all translations share the same types.",
      type: "array",
      of: [{ type: "string" }],
      options: { list: schemaTypes },
      readOnly: ({ value }) => !!value
    }),
    ...metadataFields
  ],
  preview: {
    select: {
      translations: TRANSLATIONS_ARRAY_NAME,
      documentSchemaTypes: "schemaTypes"
    },
    prepare(selection) {
      const { translations = [], documentSchemaTypes = [] } = selection, title = translations.length === 1 ? "1 Translation" : `${translations.length} Translations`, languageKeys = translations.length ? translations.map((t) => t._key.toUpperCase()).join(", ") : "", subtitle = [
        languageKeys ? `(${languageKeys})` : null,
        documentSchemaTypes != null && documentSchemaTypes.length ? documentSchemaTypes.map((s) => s).join(", ") : ""
      ].filter(Boolean).join(" ");
      return {
        title,
        subtitle
      };
    }
  }
}), __defProp = Object.defineProperty, __defProps = Object.defineProperties, __getOwnPropDescs = Object.getOwnPropertyDescriptors, __getOwnPropSymbols = Object.getOwnPropertySymbols, __hasOwnProp = Object.prototype.hasOwnProperty, __propIsEnum = Object.prototype.propertyIsEnumerable, __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp.call(b, prop) && __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b))
      __propIsEnum.call(b, prop) && __defNormalProp(a, prop, b[prop]);
  return a;
}, __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const documentInternationalization = definePlugin(
  (config2) => {
    const pluginConfig = __spreadValues(__spreadValues({}, DEFAULT_CONFIG), config2), {
      supportedLanguages,
      schemaTypes,
      languageField,
      bulkPublish,
      metadataFields
    } = pluginConfig;
    if (schemaTypes.length === 0)
      throw new Error(
        "You must specify at least one schema type on which to enable document internationalization. Update the `schemaTypes` option in the documentInternationalization() configuration."
      );
    return {
      name: "@sanity/document-internationalization",
      studio: {
        components: {
          layout: (props) => DocumentInternationalizationProvider(__spreadProps(__spreadValues({}, props), { pluginConfig }))
        }
      },
      i18n: {
        bundles: [documentInternationalizationUsEnglishLocaleBundle]
      },
      // Adds:
      // - A bulk-publishing UI component to the form
      // - Will only work for projects on a compatible plan
      form: {
        components: {
          input: (props) => {
            var _a, _b, _c;
            if (props.id === "root" && props.schemaType.name === METADATA_SCHEMA_NAME && isSanityDocument(props == null ? void 0 : props.value)) {
              const metadataId = (_a = props == null ? void 0 : props.value) == null ? void 0 : _a._id, translations = (_c = (_b = props == null ? void 0 : props.value) == null ? void 0 : _b.translations) != null ? _c : [], weakAndTypedTranslations = translations.filter(
                ({ value }) => (value == null ? void 0 : value._weak) && value._strengthenOnPublish
              );
              return /* @__PURE__ */ jsxs(Stack, { space: 5, children: [
                bulkPublish ? /* @__PURE__ */ jsx(BulkPublish, { translations }) : null,
                weakAndTypedTranslations.length > 0 ? /* @__PURE__ */ jsx(
                  OptimisticallyStrengthen,
                  {
                    metadataId,
                    translations: weakAndTypedTranslations
                  }
                ) : null,
                props.renderDefault(props)
              ] });
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
          const { schemaType, documentId } = ctx;
          return schemaTypes.includes(schemaType) && documentId ? [
            ...prev,
            (props) => DocumentInternationalizationMenu(__spreadProps(__spreadValues({}, props), { documentId }))
          ] : prev;
        },
        badges: (prev, { schemaType }) => schemaTypes.includes(schemaType) ? [(props) => LanguageBadge(props), ...prev] : prev,
        actions: (prev, { schemaType }) => schemaType === METADATA_SCHEMA_NAME ? [...prev, DeleteMetadataAction] : prev
      },
      // Adds:
      // - The `Translations metadata` document type to the schema
      schema: {
        // Create the metadata document type
        types: [metadata(schemaTypes, metadataFields)],
        // For every schema type this plugin is enabled on
        // Create an initial value template to set the language
        templates: (prev, { schema }) => {
          if (!Array.isArray(supportedLanguages))
            return prev;
          const parameterizedTemplates = schemaTypes.map((schemaType) => {
            var _a, _b;
            return {
              id: `${schemaType}-parameterized`,
              title: `${(_b = (_a = schema == null ? void 0 : schema.get(schemaType)) == null ? void 0 : _a.title) != null ? _b : schemaType}: with Language`,
              schemaType,
              parameters: [
                { name: "languageId", title: "Language ID", type: "string" }
              ],
              value: ({ languageId }) => ({
                [languageField]: languageId
              })
            };
          }), staticTemplates = schemaTypes.flatMap((schemaType) => supportedLanguages.map((language) => {
            var _a, _b;
            return {
              id: `${schemaType}-${language.id}`,
              title: `${language.title} ${(_b = (_a = schema == null ? void 0 : schema.get(schemaType)) == null ? void 0 : _a.title) != null ? _b : schemaType}`,
              schemaType,
              value: {
                [languageField]: language.id
              }
            };
          }));
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
          fieldTypes: [
            defineField(
              {
                name: "reference",
                type: "reference",
                to: schemaTypes.map((type) => ({ type })),
                weak: pluginConfig.weakReferences,
                // Reference filters don't actually enforce validation!
                validation: (Rule) => (
                  // @ts-expect-error - fix typings
                  Rule.custom(async (item, context) => {
                    var _a;
                    if (!((_a = item == null ? void 0 : item.value) != null && _a._ref) || !(item != null && item._key))
                      return !0;
                    const valueLanguage = await context.getClient({ apiVersion: API_VERSION }).fetch(
                      `*[_id in [$ref, $draftRef]][0].${languageField}`,
                      {
                        ref: item.value._ref,
                        draftRef: `drafts.${item.value._ref}`
                      }
                    );
                    return valueLanguage && valueLanguage === item._key ? !0 : "Referenced document does not have the correct language value";
                  })
                ),
                options: {
                  // @ts-expect-error - Update type once it knows the values of this filter
                  filter: ({ parent, document }) => {
                    if (!parent)
                      return null;
                    const language = (Array.isArray(parent) ? parent : [parent]).find((p) => p._key);
                    return language != null && language._key ? document.schemaTypes ? {
                      filter: `_type in $schemaTypes && ${languageField} == $language`,
                      params: {
                        schemaTypes: document.schemaTypes,
                        language: language._key
                      }
                    } : {
                      filter: `${languageField} == $language`,
                      params: { language: language._key }
                    } : null;
                  }
                }
              },
              { strict: !1 }
            )
          ]
        })
      ]
    };
  }
);
export {
  DeleteTranslationAction,
  DocumentInternationalizationMenu,
  DuplicateWithTranslationsAction,
  documentInternationalization,
  useDocumentInternationalizationContext
};
//# sourceMappingURL=index.mjs.map
