import { connection } from "next/server";
import type { Metadata } from "next";
import { getSettings } from "@/lib/data";
import { dbPath } from "@/lib/db";
import { today } from "@/lib/dates";
import { PageEnter } from "@/components/Motion";
import { Canvas, ScreenTitle } from "@/components/ui";
import { SettingsForm } from "@/components/forms/SettingsForm";
import { EditorModeForm } from "@/components/forms/EditorModeForm";
import { editorModeOn, isLoopback, studioByEnvironment } from "@/lib/studio-access";
import { headers } from "next/headers";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await connection();
  const s = getSettings();
  const local = isLoopback((await headers()).get("host"));
  return (
    <PageEnter>
      <Canvas>
        <ScreenTitle title="Settings" />
        <div className="flex flex-col gap-10">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-12" aria-labelledby="path-h">
            <div className="md:col-span-4">
              <h2 id="path-h" className="text-[16px] font-medium">Your path</h2>
              <p className="mt-1 text-[14px] text-muted">The start date anchors the 24-month calendar. The weekly target is compared with the time you log on completed tasks.</p>
            </div>
            <div className="panel md:col-span-8">
              <SettingsForm defaults={{ startDate: s.startDate ?? today(), weeklyTargetHours: s.weeklyTargetHours, name: s.name }} />
            </div>
          </section>
          <section className="grid grid-cols-1 gap-4 border-t border-border pt-10 md:grid-cols-12" aria-labelledby="data-h">
            <div className="md:col-span-4">
              <h2 id="data-h" className="text-[16px] font-medium">Your data</h2>
              <p className="mt-1 text-[14px] text-muted">Everything — progress, tasks, notes and reflections — is in one local database file. Nothing is sent anywhere.</p>
            </div>
            <div className="panel flex flex-col gap-4 md:col-span-8">
              <p className="break-all text-[14px]"><span className="text-muted">Database:</span> <code>{dbPath()}</code></p>
              <div>
                <a href="/api/backup" className="btn btn-primary" download>Download a backup</a>
                <p className="mt-2 text-[13px] text-muted">A consistent copy of the database, safe to take while URHA is running. To restore, stop URHA and replace the database file with the backup. <code>npm run backup</code> writes the same copy into <code>data/backups/</code>.</p>
              </div>
            </div>
          </section>
          <section className="grid grid-cols-1 gap-4 border-t border-border pt-10 md:grid-cols-12" aria-labelledby="editor-h">
            <div className="md:col-span-4">
              <h2 id="editor-h" className="text-[16px] font-medium">Environment editor</h2>
              <p className="mt-1 text-[14px] text-muted">Edit the Realm and the three destinations: objects, lights, materials, cameras, fog and rendering. It saves scene files on this machine, so it works only here, never from another device.</p>
            </div>
            <div className="panel md:col-span-8">
              {local ? <EditorModeForm on={editorModeOn()} byEnvironment={studioByEnvironment()} /> : <p className="text-[14px] text-muted">Open URHA on the machine running it to change this.</p>}
            </div>
          </section>
        </div>
      </Canvas>
    </PageEnter>
  );
}
