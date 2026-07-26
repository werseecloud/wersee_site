import { legalConfig } from '../config/legal.js';

export const eulaMeta = Object.freeze({
  version: '1.0',
  // Fixed publication date for this legal text. Do not derive from build time.
  lastUpdated: 'July 23, 2026',
  title: 'End User License Agreement',
  subtitle: 'Wersee Desktop and related software',
  canonicalPath: '/eula',
  description:
    'Read the End User License Agreement governing the installation and use of Wersee Desktop and related Wersee software.',
  openGraphDescription:
    'The license terms governing the use of Wersee Desktop and related software.',
});

const providerName = legalConfig.legalEntityName || legalConfig.brandName;

export const eulaSections = Object.freeze([
  {
    id: 'introduction',
    title: 'Introduction and acceptance',
    html: `<p>This End User License Agreement (“EULA”) is a legal agreement between you and the legal entity that provides the Wersee software and related services to you (“${providerName}”, “we”, “us” or “our”). It governs Wersee Desktop and any other installable Wersee software, including associated components, documentation, updates and upgrades (together, the “Software”).</p>
      <p>By downloading, installing, opening or using the Software, you agree to this EULA. If you do not agree, do not download, install or use the Software. If you use the Software for a company or other organisation, you represent that you have authority to bind that organisation to this EULA; in that case, “you” includes that organisation.</p>`,
  },
  {
    id: 'related-terms',
    title: 'Relationship with other Wersee terms',
    html: `<p>This EULA should be read together with the <a href="/terms">Wersee Terms of Service</a> and the <a href="/privacy">Wersee Privacy Policy</a>. The Terms of Service govern your Wersee account and the online services, while this EULA specifically governs the licence to install and use the Software.</p>
      <p>If these documents conflict, this EULA takes priority only for matters concerning the Software licence. Mandatory law always prevails where it cannot lawfully be varied by agreement.</p>`,
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    html: `<p>You may use the Software only if you have the legal capacity to enter into this EULA. If you do not have that capacity, a parent, guardian or other legally authorised representative must enter into the agreement where permitted by the applicable Wersee terms and law.</p>`,
  },
  {
    id: 'license-grant',
    title: 'Licence grant',
    html: `<p>While you comply with this EULA and the applicable Wersee terms, Wersee grants you a limited, non-exclusive, non-transferable, non-sublicensable and revocable licence to install and use the object-code version of the Software that Wersee officially makes available to you.</p>
      <p>The licence is for normal business or personal use and is limited to the users, devices and workspaces included with your account or subscription. It does not transfer ownership of the Software, source code or any intellectual-property right to you.</p>`,
  },
  {
    id: 'license-restrictions',
    title: 'Licence restrictions',
    html: `<p>Except where this EULA or mandatory law expressly permits it, you must not:</p>
      <ul>
        <li>copy, publish or distribute the Software beyond what is expressly allowed;</li>
        <li>sell, rent, lease, sublicense or commercially redistribute the Software;</li>
        <li>reverse engineer, decompile or disassemble the Software;</li>
        <li>bypass or interfere with security, authentication, subscription or licence controls;</li>
        <li>remove copyright, trade mark or other proprietary notices;</li>
        <li>use the Software for malware, fraud, unauthorised access or any other unlawful activity;</li>
        <li>disrupt, damage or overload Wersee systems or the systems of others; or</li>
        <li>use the Software to copy a competing product in a way that infringes Wersee’s rights.</li>
      </ul>
      <p>Nothing in this section restricts rights you retain under mandatory law, including any non-waivable right to achieve interoperability. Where the law requires you to request information before exercising such a right, contact us first.</p>`,
  },
  {
    id: 'accounts-security',
    title: 'Accounts and security',
    html: `<p>Some Software features require a Wersee account and an internet connection. You are responsible for providing accurate account information, keeping credentials confidential, securing your devices, and activity carried out through your account. Notify Wersee promptly if you suspect unauthorised access or misuse. Additional account rules are in the <a href="/terms">Terms of Service</a>.</p>`,
  },
  {
    id: 'subscriptions-payments',
    title: 'Subscriptions, payments and trials',
    html: `<p>Paid features, subscriptions, trials, renewals, cancellations and refunds are governed by the applicable <a href="/terms">Terms of Service</a>, the plan you select and, where relevant, the terms of the app store or payment provider used for the transaction. This EULA does not set or replace pricing terms.</p>`,
  },
  {
    id: 'updates',
    title: 'Updates and changes to the Software',
    html: `<p>Wersee may provide updates, patches, security improvements and new versions. Some updates may be necessary for security, compatibility or continued use. The Software may update automatically where your settings and platform rules allow it.</p>
      <p>Wersee may change the Software over time, but will do so subject to applicable consumer law and existing contractual obligations. This EULA does not give Wersee an unlimited right to remove paid functionality.</p>`,
  },
  {
    id: 'user-content',
    title: 'User content and customer data',
    html: `<p>You retain your rights in content and data you provide, to the extent you lawfully hold those rights. You grant Wersee only the limited rights reasonably needed to host, transmit, process, secure, support and otherwise provide the Software and related services.</p>
      <p>How Wersee processes personal data is described in the <a href="/privacy">Privacy Policy</a> and, where applicable, a Data Processing Agreement. Unless a separate written agreement expressly says otherwise, the Software does not include a promise of unlimited backups or guaranteed data recovery. You remain responsible for maintaining appropriate copies of important data.</p>`,
  },
  {
    id: 'third-party',
    title: 'Third-party services and open-source software',
    html: `<p>The Software may connect to third-party services and may include open-source components. Third-party terms, privacy notices and open-source licences continue to apply to those services and components. To the extent permitted by law, Wersee is not responsible for third-party services outside its control, except where a separate agreement or applicable law requires otherwise.</p>`,
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual property',
    html: `<p>Wersee and its licensors retain all intellectual-property rights in the Software, its design, trade marks, documentation and underlying technology. This EULA grants only the limited right of use stated in section 4. It does not give you an implied right to use Wersee’s name, logos or trade marks.</p>`,
  },
  {
    id: 'feedback',
    title: 'Feedback',
    html: `<p>You may voluntarily provide ideas, suggestions or other feedback. You give Wersee a worldwide, perpetual, royalty-free right to use that feedback to operate and improve its products and services. This does not transfer ownership of your pre-existing content, and Wersee will not publish confidential user data merely because it appears in feedback.</p>`,
  },
  {
    id: 'beta-features',
    title: 'Beta and preview features',
    html: `<p>Features identified as beta, experimental, preview or similar may be incomplete, contain errors, change without notice and be unsuitable for production use. Use them with appropriate caution and backups. Nothing in this section excludes a guarantee, remedy or other right that cannot lawfully be excluded.</p>`,
  },
  {
    id: 'availability-support',
    title: 'Availability, support and maintenance',
    html: `<p>Wersee works to keep the Software available and secure, but does not promise uninterrupted or error-free operation. Maintenance, incidents and matters outside Wersee’s reasonable control may affect availability. Information about available assistance is on the <a href="${legalConfig.supportPath}">Wersee Support page</a>. No response time or service level applies unless it is expressly included in a separate written agreement.</p>`,
  },
  {
    id: 'privacy-telemetry',
    title: 'Privacy and telemetry',
    html: `<p>The Software may process technical, diagnostic, security and usage information needed to operate, protect, troubleshoot and improve the Software, as described in the <a href="/privacy">Privacy Policy</a> and subject to applicable choices and consent requirements. This EULA does not make additional promises about analytics, encryption or data location beyond the Privacy Policy and the Software’s actual implementation.</p>`,
  },
  {
    id: 'termination',
    title: 'Suspension and termination',
    html: `<p>You may end this licence by stopping use of the Software and uninstalling all copies under your control. Wersee may suspend or terminate the licence for a material breach, misuse, a security risk, a legal obligation, or termination of the related account or service agreement.</p>
      <p>Where appropriate, Wersee will provide notice and a reasonable opportunity to remedy a breach. No cure period is required where immediate action is reasonably necessary to address fraud, an urgent security risk or a legal requirement. When the licence ends, you must stop using and remove the Software. Provisions that by their nature should survive—including ownership, liability, indemnity and dispute provisions—remain in effect.</p>`,
  },
  {
    id: 'warranties',
    title: 'Disclaimer of warranties',
    html: `<p>The Software is provided on an “as available” basis and, to the extent permitted by law, “as is”. Wersee does not warrant that every feature will always be available, uninterrupted, secure or error free.</p>
      <p>Nothing in this EULA excludes statutory guarantees, consumer remedies or other rights that cannot lawfully be excluded or limited, including rights available to consumers in the European Economic Area.</p>`,
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    html: `<p><strong>Business users.</strong> To the maximum extent permitted by law, Wersee is not liable for indirect, incidental, special, consequential or punitive loss, including lost profits, data or goodwill. Wersee’s aggregate liability for claims relating to the Software is limited to ${legalConfig.businessLiabilityCap}, consistent with the published Terms of Service.</p>
      <p><strong>Consumers.</strong> Any limitation applies only to the extent permitted by the mandatory law that protects you. Nothing in this EULA limits or excludes liability where doing so is unlawful, including liability for intentional misconduct, liability for gross negligence where it cannot be limited, or death or personal injury caused by negligence where exclusion is prohibited.</p>`,
  },
  {
    id: 'indemnification',
    title: 'Indemnification',
    html: `<p>This section applies only if you use the Software for business purposes. You will indemnify Wersee and its affiliates against third-party claims, losses and reasonable costs to the extent caused by your unlawful use of the Software, your infringement of third-party rights, content you provide, or your material breach of this EULA. It does not apply to consumers acting outside a trade, business or profession, and does not cover loss caused by Wersee.</p>`,
  },
  {
    id: 'export-controls',
    title: 'Export controls and sanctions',
    html: `<p>You must not use, export, re-export or otherwise make the Software available in violation of applicable export-control, sanctions or trade laws. You are responsible for complying with laws that apply to your use and location.</p>`,
  },
  {
    id: 'governing-law',
    title: 'Governing law and disputes',
    html: `<p>This EULA is governed by ${legalConfig.governingLaw}. Subject to mandatory law, disputes are submitted to ${legalConfig.competentCourts}. If you are a consumer, this does not prevent you from bringing proceedings in any court that has jurisdiction under the mandatory law of your place of residence.</p>
      <p>This EULA does not impose mandatory arbitration or waive collective rights.</p>`,
  },
  {
    id: 'changes',
    title: 'Changes to this EULA',
    html: `<p>Wersee may update this EULA to reflect changes in the Software, law, security needs or business operations. Material changes will be announced in a reasonable manner before they take effect where required. The “Last updated” date changes only when the legal text changes. Continued use after an update takes effect constitutes acceptance only to the extent permitted by law.</p>`,
  },
  {
    id: 'contact',
    title: 'Contact information',
    html: `<p>Questions about this EULA may be sent to <a href="mailto:${legalConfig.legalEmail}">${legalConfig.legalEmail}</a>. You can also use the <a href="${legalConfig.supportPath}">Wersee Support page</a>.</p>`,
  },
  {
    id: 'store-terms',
    title: 'Store-specific terms',
    html: `<p>If you obtained the Software through Microsoft Store, Apple App Store, Mac App Store or another distribution platform, that platform’s additional terms may apply. The distribution platform is not a party to this EULA unless its own terms expressly provide otherwise.</p>`,
  },
]);

export const eulaContactDetails = Object.freeze([
  legalConfig.legalEntityName,
  legalConfig.registeredAddress,
  legalConfig.companyRegistrationNumber
    ? `Company registration number: ${legalConfig.companyRegistrationNumber}`
    : null,
  `Legal email: ${legalConfig.legalEmail}`,
].filter(Boolean));

