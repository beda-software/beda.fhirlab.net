import { PlusOutlined } from '@ant-design/icons';
import { t, Trans } from '@lingui/macro';
import { Observation, ObservationComponent } from 'fhir/r4b';

import { questionnaireAction, ResourceListPage } from '@beda.software/emr/components';
import { compileAsFirst, formatHumanDateTime } from '@beda.software/emr/utils';

export const getObservationCode = compileAsFirst<Observation,string>("Observation.code.coding.first().display")

export function getEffectiveDateTime(resource: Observation): string | undefined {
    return resource.effectiveDateTime ?? (resource as Observation & { effective?: { dateTime?: string } }).effective?.dateTime;
}
function getComponentValue(c: ObservationComponent) {
    if (c.dataAbsentReason) {
        return [c.dataAbsentReason.text];
    }
    return [`${c.valueQuantity?.value} ${c.valueQuantity?.unit}`];
}
export const getObservationValue = (r: Observation): string | React.ReactElement => {
    if (r.dataAbsentReason) {
        return r.dataAbsentReason.text ?? r.dataAbsentReason.coding?.[0]?.display ?? 'unknown';
    } else if (r.valueQuantity) {
        return `${r.valueQuantity.value} ${r.valueQuantity.unit}`;
    } else if (r.valueCodeableConcept) {
        return r.valueCodeableConcept.text ?? r.valueCodeableConcept.coding?.[0]?.display ?? 'Unknown';
    } else if (r.component) {
        return (
            <>
                {r.component
                    .map((c) => [...[c.code.coding?.[0]?.display], ...getComponentValue(c)].join(': '))
                    .map((v) => (
                        <div key={v}>{v}</div>
                    ))}
            </>
        );
    }
    return 'Unknown';
};


export function ObservationsUberList() {
    return (
        <ResourceListPage<Observation>
            headerTitle="Observations"
            resourceType="Observation"
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
                    render: (_text: any, { resource }) => formatHumanDateTime(resource.effectiveDateTime),
                },
                {
                    title: 'Patient',
                    dataIndex: 'patient',
                    key: 'patient',
                    render: (_text: any, { resource }) => {
                        const reference = resource.subject;
                        if (reference) {
                            return reference.display ?? reference.reference;

                        }
                    },
                },
                {
                    title: 'Code',
                    dataIndex: 'code',
                    key: 'code',
                    render: (_text: any, { resource }) => getObservationCode(resource),
                },
                {
                    title: 'Value',
                    dataIndex: 'value',
                    key: 'value',
                    render: (_text: any, { resource }) => getObservationValue(resource),
                }
            ]}
            getHeaderActions={() => [
                questionnaireAction(<Trans>Create observation</Trans>, 'observation-create-connectathon', {
                    icon: <PlusOutlined />,
                }),
            ]}
            getReportColumns={(bundle) => [
                {
                    title: t`Number of Observation`,
                    value: bundle.total,
                },
            ]}
        />
    );
}
