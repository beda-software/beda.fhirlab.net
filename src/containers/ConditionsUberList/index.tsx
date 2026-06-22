import { PlusOutlined } from '@ant-design/icons';
import { t, Trans } from '@lingui/macro';
import { Bundle, Condition, Patient } from 'fhir/r4b';

import { questionnaireAction, ResourceListPage } from '@beda.software/emr/components';
import { SearchBarColumnType } from '@beda.software/emr/dist/components/SearchBar/types';
import { compileAsFirst } from '@beda.software/emr/utils';

const getConditionCode = compileAsFirst<Condition, string>(
    'Condition.code.text | Condition.code.coding.first().display',
);
const getClinicalStatus = compileAsFirst<Condition, string>(
    'Condition.clinicalStatus.text | Condition.clinicalStatus.coding.first().display',
);

function patientFromBundle(bundle: Bundle, patientRef?: string) {
    const patientId = patientRef?.replace('Patient/', '');
    if (!patientId) {
        return undefined;
    }

    return bundle.entry
        ?.map((entry) => entry.resource)
        .find(
            (resource): resource is Patient =>
                resource?.resourceType === 'Patient' && resource.id === patientId,
        );
}

function conditionLaunchContext(resource: Condition, bundle?: Bundle) {
    const patientId = resource.subject?.reference?.replace('Patient/', '');
    const patient =
        patientFromBundle(bundle ?? { resourceType: 'Bundle', type: 'searchset' }, resource.subject?.reference) ??
        (patientId
            ? ({ resourceType: 'Patient', id: patientId } as Patient)
            : ({ resourceType: 'Patient' } as Patient));

    return [
        { name: 'Condition', resource },
        { name: 'Patient', resource: patient },
    ];
}

export function ConditionsUberList() {
    return (
        <ResourceListPage<Condition>
            headerTitle={t`Conditions`}
            resourceType="Condition"
            searchParams={{ _include: ['Condition:subject'] }}
            getTableColumns={() => [
                {
                    title: <Trans>Patient</Trans>,
                    dataIndex: 'subject',
                    key: 'subject',
                    render: (_text, { resource }) =>
                        resource.subject?.display ?? resource.subject?.reference,
                    width: 250,
                },
                {
                    title: <Trans>Code</Trans>,
                    dataIndex: 'code',
                    key: 'code',
                    render: (_text, { resource }) => getConditionCode(resource),
                    width: 280,
                },
                {
                    title: <Trans>Clinical status</Trans>,
                    dataIndex: 'clinicalStatus',
                    key: 'clinicalStatus',
                    render: (_text, { resource }) => getClinicalStatus(resource),
                    width: 150,
                },
            ]}
            getFilters={() => [
                {
                    id: 'patient',
                    searchParam: 'patient:Patient.name',
                    type: SearchBarColumnType.STRING,
                    placeholder: t`Find by patient`,
                    placement: ['search-bar', 'table'],
                },
                {
                    id: 'code',
                    searchParam: 'code',
                    type: SearchBarColumnType.STRING,
                    placeholder: t`Find by code`,
                    placement: ['search-bar', 'table'],
                },
            ]}
            getRecordActions={(record) => [
                questionnaireAction('Edit', 'condition-create-connectathon', {
                    extra: {
                        qrfProps: {
                            launchContextParameters: conditionLaunchContext(
                                record.resource,
                                record.bundle,
                            ),
                        },
                    },
                }),
            ]}
            getHeaderActions={() => [
                questionnaireAction(<Trans>Add condition</Trans>, 'condition-create-connectathon', {
                    icon: <PlusOutlined />,
                    extra: {
                        qrfProps: {
                            launchContextParameters: conditionLaunchContext({
                                resourceType: 'Condition',
                            }),
                        },
                    },
                }),
            ]}
            getReportColumns={(bundle) => [
                {
                    title: t`Number of conditions`,
                    value: bundle.total,
                },
            ]}
        />
    );
}
