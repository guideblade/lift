import { rules } from '@/_conventions/rules.ts'
import { queries } from '@/_conventions/queries.ts'

export default rules(queries(queries.range())) satisfies Lift.Rules
