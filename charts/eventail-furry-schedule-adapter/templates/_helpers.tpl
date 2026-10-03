{{- define "eventail-furry-schedule-adapter.fullname" -}}
{{- if contains .Chart.Name .Release.Name -}}
{{- .Release.Name | trunc 56 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 56 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "eventail-furry-schedule-adapter.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{ include "eventail-furry-schedule-adapter.selectorLabels" . }}
{{- end -}}

{{- define "eventail-furry-schedule-adapter.selectorLabels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "eventail-furry-schedule-adapter.podSecurityContext" -}}
runAsNonRoot: true
runAsUser: 1000
fsGroup: 1000
seccompProfile:
  type: RuntimeDefault
{{- end -}}

{{- define "eventail-furry-schedule-adapter.containerSecurityContext" -}}
allowPrivilegeEscalation: false
readOnlyRootFilesystem: true
capabilities:
  drop:
    - ALL
{{- end -}}

{{- define "eventail-furry-schedule-adapter.claimName" -}}
{{- default (printf "%s-token-cache" (include "eventail-furry-schedule-adapter.fullname" .)) .Values.persistence.existingClaim -}}
{{- end -}}

{{- define "eventail-furry-schedule-adapter.baseEnv" -}}
- name: PORT
  value: "3000"
- name: EVENTAIL_BASE_URL
  value: {{ required "eventail.baseUrl is required" .Values.eventail.baseUrl | quote }}
- name: EVENTAIL_EDITION_ID
  value: {{ required "eventail.editionId is required" .Values.eventail.editionId | quote }}
- name: EVENTAIL_AUTH_ISSUER
  value: {{ required "eventail.auth.issuer is required" .Values.eventail.auth.issuer | quote }}
- name: EVENTAIL_AUTH_CLIENT_ID
  value: {{ required "eventail.auth.clientId is required" .Values.eventail.auth.clientId | quote }}
- name: EVENTAIL_AUTH_CLIENT_SECRET
  valueFrom:
    secretKeyRef:
      name: {{ required "eventail.auth.existingSecret is required" .Values.eventail.auth.existingSecret | quote }}
      key: clientSecret
{{- with .Values.eventail.auth.audience }}
- name: EVENTAIL_AUTH_AUDIENCE
  value: {{ . | quote }}
{{- end }}
{{- with .Values.eventail.auth.scope }}
- name: EVENTAIL_AUTH_SCOPE
  value: {{ . | quote }}
{{- end }}
{{- if .Values.eventail.auth.allowInsecureIssuer }}
- name: EVENTAIL_AUTH_ALLOW_INSECURE_ISSUER
  value: "true"
{{- end }}
{{- if .Values.persistence.enabled }}
- name: EVENTAIL_AUTH_TOKEN_CACHE_PATH
  value: /var/cache/adapter/token.json
{{- end }}
{{- with .Values.eventail.pollInterval }}
- name: EVENTAIL_POLL_INTERVAL
  value: {{ . | quote }}
{{- end }}
{{- with .Values.eventail.livePollInterval }}
- name: EVENTAIL_LIVE_POLL_INTERVAL
  value: {{ . | quote }}
{{- end }}
{{- with .Values.eventail.requestTimeout }}
- name: EVENTAIL_REQUEST_TIMEOUT
  value: {{ . | quote }}
{{- end }}
- name: DOCUMENT_LANGUAGE
  value: {{ required "document.language is required" .Values.document.language | quote }}
- name: DOCUMENT_DESCRIPTION_SOURCE
  value: {{ .Values.document.descriptionSource | quote }}
{{- with .Values.document.maxStaleness }}
- name: DOCUMENT_MAX_STALENESS
  value: {{ . | quote }}
{{- end }}
{{- with .Values.document.membershipCustomFieldKey }}
- name: DOCUMENT_MEMBERSHIP_CUSTOM_FIELD_KEY
  value: {{ . | quote }}
{{- end }}
- name: SOURCE_NAME
  value: {{ .Values.source.name | quote }}
{{- with .Values.source.vendorId }}
- name: SOURCE_VENDOR_ID
  value: {{ . | quote }}
{{- end }}
{{- end -}}

{{- define "eventail-furry-schedule-adapter.env" -}}
{{- $base := include "eventail-furry-schedule-adapter.baseEnv" . -}}
{{- $names := list -}}
{{- range fromYamlArray $base -}}
{{- $names = append $names .name -}}
{{- end -}}
{{- range (index .Values "furry-schedule-adapter").extraEnv -}}
{{- if has .name $names -}}
{{- fail (printf "furry-schedule-adapter.extraEnv sets %s, which is already set" .name) -}}
{{- end -}}
{{- $names = append $names .name -}}
{{- end -}}
{{ $base }}
{{- with (index .Values "furry-schedule-adapter").extraEnv }}
{{ toYaml . }}
{{- end }}
{{- end -}}
