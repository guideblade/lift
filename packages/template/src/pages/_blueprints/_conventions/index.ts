import { queries } from '@/_conventions/queries.ts'
import { rules } from '@/_conventions/rules.ts'

export default rules(queries(queries.range())) satisfies Lift.Rules
