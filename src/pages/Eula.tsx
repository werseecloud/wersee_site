import React from 'react';
import { Link } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { SEO } from '../components/SEO';
import { eulaContactDetails, eulaMeta, eulaSections } from '../content/eulaContent.js';

const TableOfContents = ({ mobile = false }: { mobile?: boolean }) => {
  const links = (
    <ol className="space-y-2.5 text-sm leading-5">
      {eulaSections.map((section, index) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            className="block rounded-md text-slate-600 underline-offset-4 transition-colors hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            {index + 1}. {section.title}
          </a>
        </li>
      ))}
    </ol>
  );

  if (mobile) {
    return (
      <details className="eula-mobile-toc rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:hidden">
        <summary className="cursor-pointer select-none font-bold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
          Table of contents
        </summary>
        <nav aria-label="EULA table of contents" className="mt-5 border-t border-slate-100 pt-5">
          {links}
        </nav>
      </details>
    );
  }

  return (
    <aside className="hidden lg:block" aria-label="EULA navigation">
      <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-black uppercase tracking-[0.14em] text-slate-950">Contents</h2>
        <nav aria-label="EULA table of contents">{links}</nav>
      </div>
    </aside>
  );
};

export const Eula = () => (
  <>
    <SEO
      title="End User License Agreement | Wersee"
      description={eulaMeta.description}
      openGraphDescription={eulaMeta.openGraphDescription}
      url={eulaMeta.canonicalPath}
    />

    <a
      href="#eula-content"
      className="fixed left-4 top-3 z-[200] -translate-y-24 rounded-lg bg-white px-4 py-3 font-bold text-slate-950 shadow-xl transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-600"
    >
      Skip to legal content
    </a>

    <div className="eula-page min-h-screen overflow-x-clip bg-[#f5f5f7] pb-20 pt-28 text-slate-800 sm:pt-32">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="eula-breadcrumb mb-8 text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/" className="hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-slate-800">End User License Agreement</li>
          </ol>
        </nav>

        <header className="eula-heading mb-10 border-b border-slate-200 pb-9">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.16em] text-blue-700">{eulaMeta.subtitle}</p>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {eulaMeta.title}
              </h1>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-600">
                <span>Version {eulaMeta.version}</span>
                <span>Last updated: {eulaMeta.lastUpdated}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="eula-print-button inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:border-slate-500 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              <Printer aria-hidden="true" className="h-4 w-4" />
              Print
            </button>
          </div>
        </header>

        <TableOfContents mobile />

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[240px_minmax(0,820px)]">
          <TableOfContents />

          <div id="eula-content" tabIndex={-1} className="min-w-0 scroll-mt-24 focus:outline-none">
            <article className="eula-article rounded-3xl border border-slate-200 bg-white px-5 py-8 shadow-sm sm:px-10 sm:py-12">
              <p className="mb-10 text-lg leading-8 text-slate-700">
                Please read these licence terms carefully before installing or using Wersee Desktop or related Wersee software.
              </p>

              {eulaSections.map((section, index) => (
                <section
                  id={section.id}
                  key={section.id}
                  className="eula-section scroll-mt-28 border-t border-slate-200 py-9 first:border-t-0 first:pt-0"
                >
                  <h2 className="mb-5 text-2xl font-black tracking-tight text-slate-950">
                    {index + 1}. {section.title}
                  </h2>
                  <div
                    className="eula-prose space-y-4 text-[1rem] leading-7 text-slate-700"
                    dangerouslySetInnerHTML={{ __html: section.html }}
                  />
                  {section.id === 'contact' && eulaContactDetails.length > 0 && (
                    <address className="mt-6 not-italic leading-7 text-slate-800">
                      {eulaContactDetails.map((line) => <div key={line}>{line}</div>)}
                    </address>
                  )}
                </section>
              ))}
            </article>
          </div>
        </div>
      </div>
    </div>
  </>
);
