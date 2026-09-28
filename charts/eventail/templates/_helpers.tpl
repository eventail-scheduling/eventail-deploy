{{- define "eventail.fullname" -}}
{{- if contains .Chart.Name .Release.Name -}}
{{- .Release.Name | trunc 56 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 56 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "eventail.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{ include "eventail.selectorLabels" . }}
{{- end -}}

{{- define "eventail.selectorLabels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "eventail.webOrigin" -}}
{{- $url := urlParse .Values.webUrl -}}
{{- $scheme := lower $url.scheme -}}
{{- printf "%s://%s" $scheme (lower $url.host) | trimSuffix (ternary ":443" ":80" (eq $scheme "https")) -}}
{{- end -}}

{{- define "eventail.podSecurityContext" -}}
runAsNonRoot: true
seccompProfile:
  type: RuntimeDefault
{{- end -}}

{{- define "eventail.containerSecurityContext" -}}
allowPrivilegeEscalation: false
readOnlyRootFilesystem: true
capabilities:
  drop:
    - ALL
{{- end -}}

{{- define "eventail.apiBaseEnv" -}}
- name: PORT
  value: "3000"
- name: POSTGRES_HOSTNAME
  value: {{ .Values.postgres.hostname | quote }}
- name: POSTGRES_PORT
  value: {{ .Values.postgres.port | quote }}
- name: POSTGRES_DATABASE
  value: {{ .Values.postgres.database | quote }}
- name: POSTGRES_USERNAME
  value: {{ .Values.postgres.username | quote }}
- name: POSTGRES_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ .Values.postgres.existingSecret | quote }}
      key: {{ .Values.postgres.passwordKey | quote }}
{{- if .Values.worker.enabled }}
- name: WORKER_DISABLE_BUILT_IN
  value: "true"
{{- end }}
- name: JWT_ISSUER
  value: {{ .Values.jwt.issuer | quote }}
- name: JWT_AUDIENCE
  value: {{ .Values.jwt.audience | quote }}
- name: JWT_SUPER_ADMIN_PREDICATE
  value: {{ .Values.jwt.superAdminPredicate | quote }}
- name: JWT_INTEGRATION_PREDICATE
  value: {{ .Values.jwt.integrationPredicate | quote }}
{{- with .Values.userInfo.emailAddressPath }}
- name: USER_INFO_EMAIL_ADDRESS_PATH
  value: {{ . | quote }}
{{- end }}
{{- with .Values.userInfo.displayNamePath }}
- name: USER_INFO_DISPLAY_NAME_PATH
  value: {{ . | quote }}
{{- end }}
- name: CORS_ORIGIN
  value: {{ include "eventail.webOrigin" . | quote }}
- name: FRONTEND_BASE_URL
  value: {{ .Values.webUrl | quote }}
- name: S3_BUCKET_NAME
  value: {{ .Values.s3.bucketName | quote }}
- name: S3_MAX_FILE_SIZE
  value: {{ .Values.s3.maxFileSize | quote }}
- name: S3_PUBLIC_BASE_URL
  value: {{ .Values.s3.publicBaseUrl | quote }}
- name: S3_CLIENT_ENDPOINT
  value: {{ .Values.s3.endpoint | quote }}
- name: S3_CLIENT_REGION
  value: {{ .Values.s3.region | quote }}
- name: S3_CLIENT_FORCE_PATH_STYLE
  value: {{ .Values.s3.forcePathStyle | quote }}
{{- with .Values.s3.existingSecret }}
- name: S3_CLIENT_CREDENTIALS_ACCESS_KEY_ID
  valueFrom:
    secretKeyRef:
      name: {{ . | quote }}
      key: accessKeyId
- name: S3_CLIENT_CREDENTIALS_SECRET_ACCESS_KEY
  valueFrom:
    secretKeyRef:
      name: {{ . | quote }}
      key: secretAccessKey
{{- end }}
- name: EMAIL_SENDER
  value: {{ .Values.email.sender | quote }}
- name: EMAIL_SMTP_HOST
  value: {{ .Values.email.smtp.host | quote }}
- name: EMAIL_SMTP_PORT
  value: {{ .Values.email.smtp.port | quote }}
{{- with .Values.email.smtp.existingSecret }}
- name: EMAIL_SMTP_AUTH_USER
  valueFrom:
    secretKeyRef:
      name: {{ . | quote }}
      key: user
- name: EMAIL_SMTP_AUTH_PASS
  valueFrom:
    secretKeyRef:
      name: {{ . | quote }}
      key: pass
{{- end }}
{{- end -}}

{{- define "eventail.assertUniqueEnv" -}}
{{- $names := list -}}
{{- range fromYamlArray .env -}}
{{- $names = append $names .name -}}
{{- end -}}
{{- range .extraEnv -}}
{{- if has .name $names -}}
{{- fail (printf "%s sets %s, which is already set" $.key .name) -}}
{{- end -}}
{{- $names = append $names .name -}}
{{- end -}}
{{- end -}}

{{- define "eventail.apiEnv" -}}
{{- $base := include "eventail.apiBaseEnv" . -}}
{{- include "eventail.assertUniqueEnv" (dict "env" $base "extraEnv" .Values.api.extraEnv "key" "api.extraEnv") -}}
{{ $base }}
{{- with .Values.api.extraEnv }}
{{ toYaml . }}
{{- end }}
{{- end -}}

{{- define "eventail.workerEnv" -}}
{{- $base := include "eventail.apiEnv" . -}}
{{- include "eventail.assertUniqueEnv" (dict "env" $base "extraEnv" .Values.worker.extraEnv "key" "worker.extraEnv") -}}
{{ $base }}
{{- with .Values.worker.extraEnv }}
{{ toYaml . }}
{{- end }}
{{- end -}}
