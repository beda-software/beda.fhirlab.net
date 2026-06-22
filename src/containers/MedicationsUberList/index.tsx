import { PlusOutlined } from '@ant-design/icons';
import { t, Trans } from '@lingui/macro';
import { MedicationStatement, Reference } from 'fhir/r4b';

import { questionnaireAction, ResourceListPage } from '@beda.software/emr/components';
import { SearchBarColumnType } from '@beda.software/emr/dist/components/SearchBar/types';
import { compileAsFirst } from '@beda.software/emr/utils';

const getMedicationCode = compileAsFirst<Medication, string>(
    'Medication.code.text | Medication.code.coding.first().display',
);
import { formatHumanDateTime } from '@beda.software/emr/utils';

function getPatientLabel(subject?: Reference): string | undefined {
    if (!subject) {
        return undefined;
    }
    if (subject.display) {
        return subject.display;
    }
    if (subject.reference) {
        return subject.reference;
    }
    const aidboxSubject = subject as Reference & { id?: string; resourceType?: string };
    if (aidboxSubject.id && aidboxSubject.resourceType) {
        return `${aidboxSubject.resourceType}/${aidboxSubject.id}`;
    }
    return undefined;
}

function getMedicationLabel(resource: MedicationStatement): string | undefined {
    return (
        resource.medicationReference?.display ??
        resource.medicationCodeableConcept?.text ??
        resource.medicationCodeableConcept?.coding?.[0]?.display
    );
}

function getEffectiveDateTime(resource: MedicationStatement): string | undefined {
    return (
        resource.effectiveDateTime ??
        resource.effectivePeriod?.start ??
        (resource as MedicationStatement & { effective?: { dateTime?: string } }).effective?.dateTime
    );
}

export function MedicationsUberList() {
    return (
        <ResourceListPage<MedicationStatement>
            headerTitle="Medications"
            resourceType="MedicationStatement"
            getTableColumns={() => [
                {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    render: (_text: any, { resource }) => {
                        return resource.status;
                    },
                },
                {
                    title: 'Date',
                    dataIndex: 'date',
                    key: 'date',
                    width: 200,
                    render: (_text: any, { resource }) => formatHumanDateTime(getEffectiveDateTime(resource)),
                },
                {
                    title: 'Medication',
                    key: 'medication',
                    width: 250,
                    render: (_text: any, { resource }) => getMedicationLabel(resource),
                },
                {
                    title: 'Patient',
                    dataIndex: 'subject',
                    key: 'patient',
                    render: (_text: any, { resource }) => getPatientLabel(resource.subject),
                },
                {
                    title: 'Category',
                    key: 'category',
                    render: (_text: any, { resource }) =>
                        resource.category?.text ?? resource.category?.coding?.[0]?.display,
                },
            ]}
            getFilters={() => [
                {
                    id: 'status',
                    searchParam: 'status',
                    type: SearchBarColumnType.CHOICE,
                    placeholder: t`Choose status`,
                    options: [
                        {
                            value: {
                                Coding: {
                                    code: 'active',
                                    display: 'Active',
                                },
                            },
                        },
                        {
                            value: {
                                Coding: {
                                    code: 'completed',
                                    display: 'Completed',
                                },
                            },
                        },
                        {
                            value: {
                                Coding: {
                                    code: 'stopped',
                                    display: 'Stopped',
                                },
                            },
                        },
                        {
                            value: {
                                Coding: {
                                    code: 'on-hold',
                                    display: 'On hold',
                                },
                            },
                        },
                        {
                            value: {
                                Coding: {
                                    code: 'entered-in-error',
                                    display: 'Entered in error',
                                },
                            },
                        },
                        {
                            value: {
                                Coding: {
                                    code: 'intended',
                                    display: 'Intended',
                                },
                            },
                        },
                        {
                            value: {
                                Coding: {
                                    code: 'not-taken',
                                    display: 'Not taken',
                                },
                            },
                        },
                        {
                            value: {
                                Coding: {
                                    code: 'unknown',
                                    display: 'Unknown',
                                },
                            },
                        },
                    ],
                    placement: ['table', 'search-bar'],
                },
                {
                    id: 'patient',
                    searchParam: 'patient:Patient.name',
                    type: SearchBarColumnType.STRING,
                    placeholder: 'Find by patient',
                    placement: ['search-bar', 'table'],
                },
            ]}
            getRecordActions={(record) => [
                questionnaireAction('Edit', 'medication-statement-create-connectathon', {
                    extra: {
                        qrfProps: {
                            launchContextParameters: [
                                { name: 'MedicationStatement', resource: record.resource },
                            ],
                        },
                    },
                }),
            ]}
            getHeaderActions={() => [
                questionnaireAction(<Trans>Create medication</Trans>, 'medication-statement-create-connectathon', {
                    icon: <PlusOutlined />,
                    extra: {
                        qrfProps: {
                            launchContextParameters: [
                                { name: 'MedicationStatement', resource: { resourceType: 'MedicationStatement' } },
                            ],
                        },
                    },
                }),
            ]}
            getReportColumns={(bundle) => [
                {
                    title: t`Number of Medication Statements`,
                    value: bundle.total,
                },
            ]}
        />
    );
}
