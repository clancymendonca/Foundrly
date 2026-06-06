import type {StructureResolver} from 'sanity/structure'

import { ModerationDashboard } from './components/ModerationDashboard'

import { ReportReviewPanel } from './components/ReportReviewPanel'

import { InterestedSubmissionsPanel } from './components/InterestedSubmissionsPanel'

import { BadgeManagerPanel } from './components/BadgeManagerPanel'

import { AnalyticsDashboard } from './components/AnalyticsDashboard'

import { AuthorBanPanel } from './components/AuthorBanPanel'



export const structure: StructureResolver = (S) =>

  S.list()

    .title('Content')

    .items([

      S.listItem()

        .title('Reports & Moderation')

        .id('reports-moderation')

        .child(

          S.list()

            .title('Reports & Moderation')

            .items([

              S.listItem()

                .id('moderation-dashboard')

                .title('Moderation Dashboard')

                .child(

                  S.component()

                    .component(ModerationDashboard)

                    .title('Moderation Dashboard')

                ),

              S.listItem()

                .id('report-triage')

                .title('Report Triage')

                .child(

                  S.component()

                    .component(ReportReviewPanel)

                    .title('Report Triage')

                ),

              S.listItem()

                .id('all-reports')

                .title('All Reports (raw)')

                .child(

                  S.documentList()

                    .title('All Reports')

                    .filter('_type == "report"')

                    .defaultOrdering([{field: 'timestamp', direction: 'desc'}])

                ),

              S.listItem()

                .id('moderation-activity')

                .title('Activity Log (raw)')

                .child(

                  S.documentList()

                    .title('Moderation Activity')

                    .filter('_type == "moderationActivity"')

                    .defaultOrdering([{field: 'timestamp', direction: 'desc'}])

                ),

            ])

        ),

      S.listItem()

        .title('Community')

        .id('community')

        .child(

          S.list()

            .title('Community')

            .items([

              S.listItem()

                .id('badge-manager')

                .title('Badge Manager')

                .child(

                  S.component()

                    .component(BadgeManagerPanel)

                    .title('Badge Manager')

                ),

              S.documentTypeListItem('badge').title('Badges (raw)'),

              S.documentTypeListItem('userBadge').title('User Badges (raw)'),

              S.listItem()

                .id('notifications')

                .title('Notifications')

                .child(

                  S.documentList()

                    .title('Notifications')

                    .filter('_type == "notification"')

                    .defaultOrdering([{field: '_createdAt', direction: 'desc'}])

                ),

              S.documentTypeListItem('accountHistory').title('Account History'),

            ])

        ),

      S.listItem()

        .title('Submissions')

        .id('submissions')

        .child(

          S.component()

            .component(InterestedSubmissionsPanel)

            .title('Interested Submissions')

        ),

      S.listItem()

        .title('Analytics')

        .id('analytics')

        .child(

          S.list()

            .title('Analytics')

            .items([

              S.listItem()

                .id('analytics-dashboard')

                .title('Dashboard')

                .child(

                  S.component()

                    .component(AnalyticsDashboard)

                    .title('Analytics Dashboard')

                ),

              S.documentTypeListItem('startupLikeEvent').title('Like Events (raw)'),

              S.documentTypeListItem('startupDislikeEvent').title('Dislike Events (raw)'),

              S.documentTypeListItem('startupCommentEvent').title('Comment Events (raw)'),

              S.documentTypeListItem('searchEvent').title('Search Events (raw)'),

            ])

        ),

      S.listItem()

        .title('System')

        .id('system')

        .child(

          S.list()

            .title('System')

            .items([

              S.documentTypeListItem('pushSubscription').title('Push Subscriptions'),

            ])

        ),

      S.documentTypeListItem('author')
        .title('Authors')
        .child(
          S.documentList()
            .title('Authors')
            .filter('_type == "author"')
            .child((documentId) =>
              S.document()
                .documentId(documentId)
                .schemaType('author')
                .views([
                  S.view.form(),
                  S.view.component(AuthorBanPanel).title('Ban Management'),
                ])
            )
        ),

      S.documentTypeListItem('startup').title('Startups'),

      S.documentTypeListItem('comment').title('Comments'),

      S.documentTypeListItem('playlist').title('Playlists'),

    ])

