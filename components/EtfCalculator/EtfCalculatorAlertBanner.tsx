"use client"

import { Bell, Github, Mail, MessageCircle } from "lucide-react"
import { getAlertRequestMailto } from "@/lib/site-config"

interface EtfCalculatorAlertBannerProps {
  realtimeAlertTitle: string
  realtimeAlertDesc: string
  alertRequestViaIssue: string
  alertRequestViaEmail: string
  alertRequestJoinTelegram: string
  alertRequestEmailSubject: string
  alertRequestEmailBody: string
  alertRequestIssueUrl: string
  telegramChannelUrl?: string
}

export const EtfCalculatorAlertBanner = ({
  realtimeAlertTitle,
  realtimeAlertDesc,
  alertRequestViaIssue,
  alertRequestViaEmail,
  alertRequestJoinTelegram,
  alertRequestEmailSubject,
  alertRequestEmailBody,
  alertRequestIssueUrl,
  telegramChannelUrl,
}: EtfCalculatorAlertBannerProps) => {
  return (
    <section className="mt-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <Bell className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg">
              {realtimeAlertTitle}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
              {realtimeAlertDesc}
            </p>
          </div>
        </div>
        <div className="flex w-full justify-center gap-2 shrink-0 sm:w-auto sm:justify-end">
          {telegramChannelUrl ? (
            <a
              href={telegramChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#0088cc] text-white hover:opacity-90 transition-opacity"
              aria-label={alertRequestJoinTelegram}
            >
              <MessageCircle className="w-5 h-5" />
            </a>
          ) : null}
          <a
            href={alertRequestIssueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:opacity-90 transition-opacity"
            aria-label={alertRequestViaIssue}
          >
            <Github className="w-5 h-5" />
          </a>
          <a
            href={getAlertRequestMailto(alertRequestEmailSubject, alertRequestEmailBody)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            aria-label={alertRequestViaEmail}
          >
            <Mail className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  )
}
