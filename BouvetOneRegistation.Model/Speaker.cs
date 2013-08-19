using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BouvetOneRegistation.Model
{
    public class Speaker
    {
        public string Name { get; set; }
        public IEnumerable<Session> Sessions { get; set; }
    }
}
