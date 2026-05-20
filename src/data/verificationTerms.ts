/**
 * Card verification service terms (display only; not legal advice).
 * Last updated for in-app verification + PUDO flow.
 */

export const VERIFICATION_TERMS_TITLE = 'Verification terms and conditions'

export const VERIFICATION_TERMS_SECTIONS: { heading?: string; paragraphs: string[] }[] = [
  {
    paragraphs: [
      'These terms apply when you request card verification through SA Player ("we", "us", "our"). By paying the verification fee and using the service, you agree to these terms.',
    ],
  },
  {
    heading: 'What the service is',
    paragraphs: [
      'We arrange identification and condition checks of trading cards you send in. Verification is for marketplace trust; it is not grading, authentication by a third-party grader, or a guarantee that a card will sell at any price.',
      'We do not take permanent custody of your cards for storage. Cards are handled only for the verification process and return shipment described below.',
    ],
  },
  {
    heading: 'PUDO submission and return',
    paragraphs: [
      'After your request is accepted and payment is confirmed, you will receive a PUDO (pick-up/drop-off) code and instructions to submit your cards at a participating locker or point.',
      'You must deposit your parcel using that code within twenty-four (24) hours of the code being issued, unless we notify you otherwise in writing. Failure to meet this deadline may void your verification request without refund.',
      'Verified cards are returned to you via PUDO (or another carrier we specify). You are responsible for collecting return parcels within any time limits set by the carrier or locker operator.',
    ],
  },
  {
    heading: 'Your responsibilities',
    paragraphs: [
      'You must pack cards securely (sleeves, top loaders, or equivalent protection suitable for post). You are solely responsible for how items are packaged and labelled.',
      'You warrant that you own the cards submitted or have authority to send them, and that submission does not breach any law or third-party right.',
      'You must provide accurate contact details and PUDO-related information. Delays or loss caused by incorrect details are your risk.',
    ],
  },
  {
    heading: 'What we are not responsible for',
    paragraphs: [
      'To the fullest extent permitted by law, we are not liable for loss, theft, damage, delay, or non-delivery of cards or parcels while in transit, in PUDO lockers, or with couriers, including The Courier Guy, PUDO, or any other logistics provider. Those services are operated by third parties under their own terms.',
      'We are not liable for indirect, consequential, or special damages (including lost profits, lost sales, or loss of data), even if we were advised such damage was possible.',
      'We do not guarantee that verification will result in a "vaulted" badge, listing approval, or any particular sale outcome. Buyer disputes, chargebacks, and platform rules remain separate from verification.',
      'We are not responsible for cards that are counterfeit, altered, or misrepresented; our review is based on the physical items received and reasonable inspection only.',
      'We are not liable for events outside our reasonable control (force majeure), including strikes, system outages, natural disasters, or government action.',
    ],
  },
  {
    heading: 'Fees and refunds',
    paragraphs: [
      'Verification fees are charged per request or per card as shown in the app at checkout. Fees are generally non-refundable once a PUDO code has been issued, if you miss the 24-hour submission window, if you cancel after dispatch instructions are sent, or if you submit empty, incorrect, or ineligible items.',
      'We may offer a partial or full refund only where we cancel the service or where required by applicable consumer law. Nothing in these terms limits rights you cannot contract away under South African law.',
    ],
  },
  {
    heading: 'Limitation of liability',
    paragraphs: [
      'Where liability cannot be excluded, our total aggregate liability to you for any claim arising from verification or these terms is limited to the verification fees you paid for the specific request giving rise to the claim.',
      'Some jurisdictions do not allow certain exclusions; in those cases, our liability is limited to the minimum permitted by law.',
    ],
  },
  {
    heading: 'Indemnity',
    paragraphs: [
      'You agree to indemnify and hold us harmless from claims, losses, and expenses (including reasonable legal fees) arising from your breach of these terms, your cards, your packaging, your use of PUDO or carriers, or any dispute with a buyer or third party related to items you submitted.',
    ],
  },
  {
    heading: 'Changes and governing law',
    paragraphs: [
      'We may update these terms by posting a new version in the app. Continued use after changes constitutes acceptance where permitted by law.',
      'These terms are governed by the laws of the Republic of South Africa. Disputes are subject to the exclusive jurisdiction of South African courts, unless mandatory consumer protections require otherwise.',
    ],
  },
  {
    paragraphs: [
      'If you do not agree, do not request verification. For questions, contact support through the app before submitting cards.',
    ],
  },
]
